import { Grammar } from "./data_types/grammar";
import { Rule, ConstantRule } from "./data_types/rules";
import { nonterminalRegex, strictIdentifierRegex } from "./data_types/constants";
import { PointerStack, Pointer } from "./data_types/pointers";
import { MatchOutcome, MatchResult } from "./data_types/match_results";
import { Suggestion } from "./data_types/suggestion";
import { deduplicate } from "./utils";

export class Parser {
    grammar: Grammar

    constructor(g: Grammar) {
        this.grammar = g;
    }

    startingPointers(rule: string): PointerStack[] {
        let pointers = this.grammar.getRule(rule).map(rule => {
            let pointer = new Pointer(rule, 0)
            return new PointerStack([pointer], 0)
        })
        return pointers
    }

    determineInterestingPositions(expression: string): number {
        let pos = expression.length;
        while (pos > 0 && strictIdentifierRegex.test(expression.substring(pos - 1))) {
            pos--;
        }

        return Math.min(pos, expression.length - 2);
    }

    progressPointer(expression: string, p: PointerStack, interestingBeyond: number): PointerStack[] {
        const whitespaceRegex = new RegExp('\\s');
        while (whitespaceRegex.test(expression[p.stringPosition])) {
            p.stringPosition++;
        }
        let currentRule = p.stack[p.stack.length - 1].rule;
        let res = currentRule.match(expression, p, this.grammar);
        switch (res.outcome) {
            case MatchOutcome.Failed:
                return res.newPointers
                    .filter(it => it.stringPosition >= interestingBeyond)
                    .map(it => new PointerStack(it.stack, it.stringPosition, true));
            case MatchOutcome.Progressing:
                return res.newPointers
                    .filter(it => it.stack.length > 0)
                    .flatMap(it => this.progressPointer(expression, it, interestingBeyond));
            case MatchOutcome.Matched:
                return res.newPointers
                    .filter(it => it.stack.length > 0);
        }
    }

    matchRules(expression: string, mp: PointerStack[]): PointerStack[] {
        let interestingBeyond = this.determineInterestingPositions(expression);
        let complete = mp.filter(it => it.complete);
        let incomplete = mp.filter(it => !it.complete);
        while (incomplete.length > 0) {
            let minPosition = Math.min(...incomplete.map(it => it.stringPosition));
            let needProgression = incomplete.filter(it => it.stringPosition == minPosition);
            let dontNeedProgression = incomplete.filter(it => it.stringPosition != minPosition);
            let progressed = needProgression.flatMap(it => this.progressPointer(expression, it, interestingBeyond));

            complete = [...complete, ...progressed.filter(it => it.complete)];
            incomplete = deduplicate([...dontNeedProgression, ...progressed.filter(it => !it.complete)]);
        }
        return complete;
    }

    tryApplyMatchedRules(expression: string, pointers: PointerStack[]): Suggestion[] {
        let suggestions = pointers.flatMap(pointer => {
            let top = pointer.stack[pointer.stack.length - 1]
            if (top.rule instanceof ConstantRule) {
                let remainingText = expression.substring(pointer.stringPosition)
                let lastToken = (top.rule as ConstantRule).token;
                if (lastToken.startsWith(remainingText)) {
                    return [new Suggestion(lastToken, remainingText.length)]
                } else {
                    return [];
                }
            } else {
                return [];
            }
        })
        return deduplicate(suggestions);
    }

    complete(expression: string, rule: string): Suggestion[] {
        let mp = this.startingPointers(rule);
        let matchedRules = this.matchRules(expression, mp);
        let completePhrases = this.tryApplyMatchedRules(expression, matchedRules);

        return completePhrases;
    }
}