import { Grammar } from "../shared/grammar";
import { ConstantRule } from "../shared/rules";
import { PointerStack, Pointer } from "./pointers";
import { MatchOutcome, MatchResult } from "./match_results";
import { Suggestion } from "./suggestion";
import { deduplicate } from "../shared/utils";
import { IO } from "../cli/io";
import { RuleRef } from "../shared/rules";
import { Parser } from "./parser";

export class ParserEngine {
    static startingPointers(rule: string): PointerStack[] {
        let fakeRule = new RuleRef(rule); //this is a "bit" hackish...
        let pointer = new Pointer(fakeRule, 0);
        return [ new PointerStack([pointer], 0) ];
    }

    static determineInterestingPositions(expression: string, identifierRegex: RegExp): number {
        let pos = expression.length;
        while (pos > 0 && identifierRegex.test(expression.substring(pos - 1))) {
            pos--;
        }

        return Math.min(pos, expression.length - 2);
    }

    static reportPointerStep(expression: string, pointers: PointerStack[], io: IO, note: string | undefined) {
        if (io && io.config.interactive) {
            if (pointers.length == 0) {
                io.warn("got zero pointers!");
            } else if (pointers.length > 1) {
                io.warn("got multiple pointers!");
            } else if (pointers.length == 1) {
                io.hr();
                if (note) {
                    io.write(note);
                }
                io.write(pointers[0].toStringAsPath(expression));
                io.ask("");
            }
        }
    }
    
    static steps = 0;

    static progressPointer(grammar: Grammar, expression: string, p: PointerStack, interestingBeyond: number, io: IO): PointerStack[] {
        ParserEngine.steps++;
        let validPointers: PointerStack[] = [];
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

    static matchRules(parser: Parser, grammar: Grammar, expression: string, mp: PointerStack[], io: IO): PointerStack[] {
        ParserEngine.steps = 0;
        const whitespaceRegex = new RegExp('\\s');
        let cycles = 0;
        let interestingBeyond = this.determineInterestingPositions(expression, parser.identifierRegex);
        let complete = mp.filter(it => it.complete);
        let incomplete = mp.filter(it => !it.complete);
        while (incomplete.length > 0) {
            let minPosition = Math.min(...incomplete.map(it => it.stringPosition));
            let needProgression = incomplete.filter(it => it.stringPosition == minPosition);
            let dontNeedProgression = incomplete.filter(it => it.stringPosition != minPosition);

            let whites = 0;
            while (whitespaceRegex.test(expression[minPosition+whites])) {
                whites++;
            }
            let shortExpression = expression.substring(minPosition+whites);

            let progressed = needProgression.flatMap(it => {
                it.stringPosition += whites;
                return ParserEngine.progressPointer(grammar, shortExpression, it, interestingBeyond, io );
            });

            complete = [...complete, ...progressed.filter(it => it.complete)];
            incomplete = deduplicate([...dontNeedProgression, ...progressed.filter(it => !it.complete)]);

            io.debug("Parsing cycle: " + cycles + " living pointers: " + incomplete.length);
            cycles++;
        }
        io.debug(ParserEngine.steps + " steps in " + cycles + " cycles, that is " + (ParserEngine.steps / cycles) + " per cycle.");
        return complete;
    }

    static tryApplyMatchedRules(parser: Parser, expression: string, pointers: PointerStack[]): Suggestion[] {
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
                        || expression[expression.length - 1].match(parser.continueAfterRegex)
                        || lastToken[0].match(parser.continueWithRegex)
                    )
                ) {
                    return [new Suggestion(lastToken, remainingText.length, pointer)]
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