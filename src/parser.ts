import { Grammar } from "./grammar";
import { Rule, ConstantRule } from "./rule_types";
import { nonterminalRegex, strictIdentifierRegex } from "./constants";
import _ from 'lodash';

function deduplicate<T>(array: T[]): T[] {
  return _.uniqWith(array, _.isEqual);
}
export class Pointer {
    rule: Rule;
    idx: number;
    consumedSomething: boolean;

    constructor (rule: Rule, index: number = 0, consumedSomething: boolean = false) {
        this.rule = rule;
        this.idx = index;
        this.consumedSomething = consumedSomething;
    }

    toString(): string {
        return "Pointer(" + this.idx + ") -> " + this.rule.toString();
    }
}

export class PointerStack {
    stack: Pointer[];
    stringPosition: number;
    complete: boolean;

    constructor (p: Pointer[], s: number, c: boolean = false) {
        this.stack = p;
        this.stringPosition = s;
        this.complete = c;
    }

    stackTracke(): string {
        return this.stack.map ( it => it.toString()).join("\n")
    }

}

export enum MatchOutcome {
    Failed,
    Matched,
    Progressing,
}

export class MatchResult {
    newPointers: PointerStack[];
    outcome: MatchOutcome

    constructor(np: PointerStack[], mo: MatchOutcome) {
        this.newPointers = np;
        this.outcome = mo;
    }
}

export class Suggestion {
    suggestion: string;
    overlap: number;

    constructor(suggestion: string, overlap: number) {
        this.suggestion = suggestion;
        this.overlap = overlap;
    }
}

export class Parser {
    grammar: Grammar

    constructor(g: Grammar) {
        this.grammar = g;
    }

    startingPointers(rule: string): PointerStack[] {
        let pointers = this.grammar.getRule(rule).map ( rule => {
            let pointer = new Pointer(rule, 0)
            return new PointerStack([pointer], 0)
        })
        return pointers
    }

    determineInterestingPositions(expression: string): number {
        let pos = expression.length;
        while (pos > 0 && strictIdentifierRegex.test(expression.substring(pos-1))) {
            pos--;
        }

        return Math.min(pos, expression.length-2);
    }

    progressPointer(expression: string, p: PointerStack, interestingBeyond: number): PointerStack[] {
        const whitespaceRegex = new RegExp('\\s');
        while (whitespaceRegex.test(expression[p.stringPosition])) {
            p.stringPosition++;
        }
        let currentRule = p.stack[p.stack.length-1].rule;
        let res = currentRule.match(expression, p, this.grammar);
        switch(res.outcome) {
            case MatchOutcome.Failed:
                res.newPointers
                .filter( it => it.stringPosition < interestingBeyond)
                .forEach( it => {
                    console.log("discarding at " + it.stringPosition + ": " + it.stack[it.stack.length-1].rule.toString())
                    if (it.stringPosition > 3) {
                        console.log(it.stackTracke())
                    }
                })

                return res.newPointers
                .filter( it => it.stringPosition >= interestingBeyond)
                .map ( it => new PointerStack(it.stack, it.stringPosition, true));
            case MatchOutcome.Progressing:
                return res.newPointers.flatMap( it => this.progressPointer(expression, it, interestingBeyond) );
            case MatchOutcome.Matched:
                return res.newPointers;
        }
    }

    matchRules(expression: string, mp: PointerStack[]): PointerStack[] {
        let interestingBeyond = this.determineInterestingPositions(expression);
        let complete = mp.filter( it => it.complete);
        let incomplete = mp.filter( it => !it.complete);
        while (incomplete.length > 0) {
            let dbgA = 666
            let minPosition = Math.min(...incomplete.map(it => it.stringPosition));
            let needProgression = incomplete.filter(it => it.stringPosition == minPosition);
            let dontNeedProgression = incomplete.filter(it => it.stringPosition != minPosition);
            let progressed = needProgression.flatMap(it => this.progressPointer(expression, it, interestingBeyond));

            complete = [...complete, ...progressed.filter(it => it.complete)];
            incomplete = deduplicate( [ ...dontNeedProgression, ...progressed.filter(it => !it.complete)] );
            let dbgB = 666
        }
        return complete;
    }

    tryApplyMatchedRules(expression: string, pointers: PointerStack[]): Suggestion[] {
        let suggestions = pointers.flatMap(pointer =>{
            let top = pointer.stack [pointer.stack.length-1]
            if (top.rule instanceof ConstantRule) {
                let remainingText = expression.substring(pointer.stringPosition)
                let lastToken = (top.rule as ConstantRule).token;
                if (lastToken.startsWith(remainingText)) {
                    return [ new Suggestion(lastToken, remainingText.length) ]
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

        let dbg = 666;

        let completePhrases = this.tryApplyMatchedRules(expression, matchedRules);

        return completePhrases;
    }
}