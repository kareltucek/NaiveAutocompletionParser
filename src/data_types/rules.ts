import { PointerStack, Pointer } from "./pointers";
import { MatchResult, MatchOutcome } from "./match_results";
import { Grammar } from "./grammar";
import { IterationType } from "./iteration_type";
import { markPointersAsConsumed, escapeRegex } from "../utils";

export interface Rule {
    match(expression: string, pointer: PointerStack, grammar: Grammar): MatchResult
};

export interface ReferencableRule extends Rule {
    name: string;
};

export class RegexRule implements Rule {
    regex: RegExp;

    constructor(r: RegExp) {
        this.regex = r;
    }

    toString(): string {
        return "/" + this.regex.toString() + "/"
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar): MatchResult {
        let res = expression.substring(pointer.stringPosition).match(this.regex)
        if (res) {
            // pop me from stack and increment string position
            let newStack = pointer.stack.slice(0, pointer.stack.length - 1);
            let markedStack = markPointersAsConsumed(newStack);
            let newPointer = new PointerStack(markedStack, pointer.stringPosition + res[0].length);
            return new MatchResult([newPointer], MatchOutcome.Matched);
        } else {
            return new MatchResult([pointer], MatchOutcome.Failed)
        }
    }
}

export class ConstantRule implements Rule {
    token: string;
    regex: RegExp;

    constructor(t: string) {
        this.token = t;
        let escapedString = escapeRegex(t)
        this.regex = new RegExp("^\\b" + escapedString + "\\b");
    }

    toString(): string {
        return '"' + this.token + '"'
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar): MatchResult {
        //todo: can we optimize this out?
        if (expression.substring(pointer.stringPosition).match(this.regex)) {
            // pop me from stack and increment string position
            let newStack = pointer.stack.slice(0, pointer.stack.length - 1);
            let markedStack = markPointersAsConsumed(newStack);
            let newPointer = new PointerStack(markedStack, pointer.stringPosition + this.token.length);

            if (newPointer.stringPosition == 7) {
                let dbg = 666;
            }

            console.log("matched at " + newPointer.stringPosition + ": " + this.token)

            return new MatchResult([newPointer], MatchOutcome.Matched);
        } else {
            // fail
            return new MatchResult([pointer], MatchOutcome.Failed)
        }
    }
}

function isReferencableRule(rule: Rule): boolean {
    // instanceof cannot match against interface :-()
    return rule instanceof SequenceRule;
}

export class RuleRef implements Rule {
    ref: string;
    tooltip: string;

    constructor(n: string, t: string = "") {
        this.ref = n;
        this.tooltip = t;
    }

    toString(): string {
        return "&" + this.ref
    }

    isSameRuleByName(rule: Rule): boolean {
        if (isReferencableRule(rule) && (rule as ReferencableRule).name == this.ref) {
            return true;
        }
        return false;
    }

    canExpandMyself(parentPointers: Pointer[]): boolean {
        for (let i = 0; i < parentPointers.length; i++) {
            let pointer = parentPointers[i];
            if (!pointer.consumedSomething && this.isSameRuleByName(pointer.rule)) {
                return false;
            }
        }
        return true;
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar): MatchResult {
        let base = pointer.stack.slice(0, pointer.stack.length - 1);

        if (this.canExpandMyself(base)) {
            let newPointers = grammar.getRule(this.ref).map(rule =>
                new PointerStack(
                    [...base, new Pointer(rule, 0)],
                    pointer.stringPosition,
                    pointer.complete
                )
            )
            return new MatchResult(newPointers, MatchOutcome.Progressing);
        } else {
            return new MatchResult([pointer], MatchOutcome.Failed);
        }
    }
}

export class SequenceRule implements Rule, ReferencableRule {
    name: string = "";
    rules: Rule[] = new Array();

    static fromRegex(n: string, r: RegExp): SequenceRule {
        let newRule = new SequenceRule();
        newRule.name = n;
        newRule.rules.push(new RegexRule(r))
        return newRule;
    }

    toString(): string {
        let sequence = this.rules
            .map(it => it.toString())
            .join(" .. ")
        return this.name + ": " + sequence
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar): MatchResult {
        let myPointer = pointer.stack[pointer.stack.length - 1]

        if (myPointer.idx < this.rules.length) {
            // increase index and push the next rule onto stack
            let newBase = pointer.stack.slice(0, pointer.stack.length - 1)
            newBase.push(new Pointer(myPointer.rule, myPointer.idx + 1, myPointer.consumedSomething));
            newBase.push(new Pointer(this.rules[myPointer.idx], 0));
            let newStack = new PointerStack(newBase, pointer.stringPosition, pointer.complete);
            return new MatchResult([newStack], MatchOutcome.Progressing)
        } else {
            // pop me from stack
            let newBase = pointer.stack.slice(0, pointer.stack.length - 1)
            let newStack = new PointerStack(newBase, pointer.stringPosition, pointer.complete);
            return new MatchResult([newStack], MatchOutcome.Progressing)
        }
    }
}

export class IterationRule implements Rule {
    iterationType: IterationType = IterationType.ZeroOrMore;
    rule: RuleRef = new RuleRef("");

    constructor(n: string, type: IterationType) {
        this.iterationType = type;
        this.rule = new RuleRef(n)
    }

    toString(): string {
        return this.rule.toString() + "*"
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar): MatchResult {
        let myPointer = pointer.stack[pointer.stack.length - 1]

        let pushChildWithoutMe = false;
        let pushChildWithMe = false;
        let pushJustBase = false;

        switch (this.iterationType) {
            case IterationType.One:
                pushChildWithMe = false;
                pushChildWithoutMe = true;
                pushJustBase = false;
                break;
            case IterationType.OneOrMore:
                pushChildWithMe = true;
                pushChildWithoutMe = true;
                pushJustBase = false;
                break;
            case IterationType.ZeroOrMore:
                pushChildWithMe = true;
                pushChildWithoutMe = true;
                pushJustBase = true;
                break;
            case IterationType.ZeroOrOne:
                pushChildWithMe = false;
                pushChildWithoutMe = true;
                pushJustBase = true;
                break;
        }

        let base = pointer.stack.slice(0, pointer.stack.length - 1);
        let results: PointerStack[] = new Array<PointerStack>();

        if (pushJustBase) {
            results.push(
                new PointerStack(
                    base,
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        if (pushChildWithoutMe) {
            results.push(
                new PointerStack(
                    [...base, new Pointer(this.rule)],
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        if (pushChildWithMe) {
            results.push(
                new PointerStack(
                    [...base, new Pointer(myPointer.rule), new Pointer(this.rule)],
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        return new MatchResult(results, MatchOutcome.Progressing);
    }
}
