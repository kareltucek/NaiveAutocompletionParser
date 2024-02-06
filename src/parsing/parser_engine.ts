import { Grammar } from "../shared/grammar";
import { Rule, ConstantRule } from "../shared/rules";
import { nonterminalRegex, strictIdentifierRegex, globalCompletionRegex, continueRegex } from "../shared/constants";
import { PointerStack, Pointer } from "./pointers";
import { MatchOutcome, MatchResult } from "./match_results";
import { Suggestion } from "./suggestion";
import { deduplicate } from "../shared/utils";
import { IO } from "../repl/io";
import { RuleRef } from "../shared/rules";
import exp from "constants";

export class ParserEngine {
    static startingPointers(rule: string): PointerStack[] {
        let fakeRule = new RuleRef(rule); //this is a "bit" hackish...
        let pointer = new Pointer(fakeRule, 0);
        return [ new PointerStack([pointer], 0) ];
    }

    static determineInterestingPositions(expression: string): number {
        let pos = expression.length;
        while (pos > 0 && strictIdentifierRegex.test(expression.substring(pos - 1))) {
            pos--;
        }

        return Math.min(pos, expression.length - 2);
    }

    static reportPointerStep(expression: string, pointers: PointerStack[], io: IO | undefined, note: string | undefined) {
        if (io) {
            if (pointers.length == 0) {
                io.write("got zero pointers!");
            } else if (pointers.length > 1) {
                io.write("got multiple pointers!");
            } else if (pointers.length == 1) {
                io.hr();
                if (note) {
                    io.write(note);
                }
                io.write(pointers[0].toStringAsPath(expression));
                io.question("");
            }
        }
    }

    static progressPointer(grammar: Grammar, expression: string, p: PointerStack, interestingBeyond: number, io: IO | undefined): PointerStack[] {
        const whitespaceRegex = new RegExp('\\s');
        while (whitespaceRegex.test(expression[p.stringPosition])) {
            p.stringPosition++;
        }
        let validPointers = [];
        let currentRule = p.stack[p.stack.length - 1].rule;
        let res = currentRule.match(expression, p, grammar, io);
        switch (res.outcome) {
            case MatchOutcome.Failed:
                this.reportPointerStep(expression, [p], io, "Failed when matching:")
                return res.newPointers
                    .filter(it => it.stringPosition >= interestingBeyond)
                    .map(it => new PointerStack(it.stack, it.stringPosition, true));
            case MatchOutcome.Progressing:
                validPointers = res.newPointers.filter(it => it.stack.length > 0)
                this.reportPointerStep(expression, validPointers, io, "Progressed:");
                return validPointers.flatMap(it => ParserEngine.progressPointer(grammar, expression, it, interestingBeyond, io));
            case MatchOutcome.Matched:
                validPointers = res.newPointers.filter(it => it.stack.length > 0)
                this.reportPointerStep(expression, res.newPointers, io, "Matched:");
                return validPointers
        }
    }

    static matchRules(grammar: Grammar, expression: string, mp: PointerStack[], io: IO | undefined = undefined): PointerStack[] {
        let interestingBeyond = this.determineInterestingPositions(expression);
        let complete = mp.filter(it => it.complete);
        let incomplete = mp.filter(it => !it.complete);
        while (incomplete.length > 0) {
            let minPosition = Math.min(...incomplete.map(it => it.stringPosition));
            let needProgression = incomplete.filter(it => it.stringPosition == minPosition);
            let dontNeedProgression = incomplete.filter(it => it.stringPosition != minPosition);
            let progressed = needProgression.flatMap(it => ParserEngine.progressPointer(grammar, expression, it, interestingBeyond, io));

            complete = [...complete, ...progressed.filter(it => it.complete)];
            incomplete = deduplicate([...dontNeedProgression, ...progressed.filter(it => !it.complete)]);
        }
        return complete;
    }

    static tryApplyMatchedRules(expression: string, pointers: PointerStack[]): Suggestion[] {
        let suggestions = pointers.flatMap(pointer => {
            let top = pointer.stack[pointer.stack.length - 1]
            if (top.rule instanceof ConstantRule) {
                let remainingText = expression.substring(pointer.stringPosition)
                let lastToken = (top.rule as ConstantRule).token;
                if (lastToken.startsWith(remainingText) && pointer.stringPosition != expression.length) {
                    return [new Suggestion(lastToken, remainingText.length)]
                } else if (
                    pointer.stringPosition == expression.length
                    && (expression == ''
                        || expression[expression.length - 1].match(globalCompletionRegex)
                        || lastToken[0].match(continueRegex)
                        // || pointer.isSubWhitePath()
                    )
                ) {
                    return [new Suggestion(lastToken, remainingText.length)]
                } else {
                    return [];
                }
            } else {
                return [];
            }
        })
        return deduplicate(suggestions)
        .sort((a,b) => a.suggestion.localeCompare(b.suggestion));
    }
}