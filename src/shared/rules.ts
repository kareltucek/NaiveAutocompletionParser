import { PointerStack, Pointer } from "../parsing/pointers";
import { MatchResult, MatchOutcome } from "../parsing/match_results";
import { Grammar } from "./grammar";
import { IterationType } from "./iteration_type";
import { markPointersAsConsumed, escapeRegex } from "./utils";
import { strictIdentifierRegex, maxRecursionDepth } from "./constants";
import { IO } from "../uhk_preset";
import exp from "constants";

class StringPathResult {
    str: string;
    offset: number;

    constructor(str: string, offset: number) {
        this.str = str;
        this.offset = offset;
    }
}

export interface Rule {
    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO | undefined): MatchResult;
    toString(): string;
    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult;
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
        return this.regex.toString() 
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO | undefined): MatchResult {
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
        if (t.match(strictIdentifierRegex)) {
            this.regex = new RegExp("^\\b" + escapedString + "\\b");
        } else {
            this.regex = new RegExp("^" + escapedString + "");
        }
    }

    toString(): string {
        return '"' + this.token + '"'
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO | undefined): MatchResult {
        //todo: can we optimize the substring out?
        if (expression.substring(pointer.stringPosition).match(this.regex)) {
            // pop me from stack and increment string position
            let newStack = pointer.stack.slice(0, pointer.stack.length - 1);
            let markedStack = markPointersAsConsumed(newStack);
            let newPointer = new PointerStack(markedStack, pointer.stringPosition + this.token.length);

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

    constructor(n: string) {
        this.ref = n;
    }

    toString(): string {
        return "&" + this.ref
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    isSameRuleByName(rule: Rule): boolean {
        if (isReferencableRule(rule) && (rule as ReferencableRule).name == this.ref) {
            return true;
        }
        return false;
    }

    canExpandMyself(parentPointers: Pointer[]): boolean {
        let similarNonexpandedAncestorsFound = 0;
        for (let i = 0; i < parentPointers.length; i++) {
            let pointer = parentPointers[i];
            if (!pointer.consumedSomething && this.isSameRuleByName(pointer.rule)) {
                similarNonexpandedAncestorsFound++;
            }
        }
        return similarNonexpandedAncestorsFound <= maxRecursionDepth;
    }

    askToFilterRules(rules: Rule[], io: IO | undefined): Rule[] {
        if (io && rules.length > 1) {
            let question = "Which rule should I expand?"
            let options = rules
                .map((rule, index) => index + ": " + rule.toString())
                .join("\n")
            io.write(question);
            io.write(options);
            io.write("default: " + io.defaultAnswer());
            let result = io.question("? ", true);
            return [rules[Number(result)]];
        } else {
            return rules;
        }
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO | undefined): MatchResult {
        let myPointer = pointer.stack[pointer.stack.length-1]
        let base = pointer.stack.slice(0, pointer.stack.length - 1);

        if (myPointer.idx == 0) {
            if (this.canExpandMyself(base)) {
                let allPossibleRules = grammar.getRule(this.ref)
                let newPointers = this.askToFilterRules(allPossibleRules, io).map(rule =>
                    new PointerStack(
                        [
                            ...base, 
                            new Pointer(myPointer.rule, 1),
                            new Pointer(rule, 0),
                        ],
                        pointer.stringPosition,
                        pointer.complete
                    )
                )
                return new MatchResult(newPointers, MatchOutcome.Progressing);
            }
        } else {
            return new MatchResult(
                [
                    new PointerStack(
                        [...base],
                        pointer.stringPosition,
                        pointer.complete
                    )
                ],
                MatchOutcome.Progressing
            )
        }
        return new MatchResult([pointer], MatchOutcome.Failed);
    }
}

export class SequenceRule implements Rule, ReferencableRule {
    name: string = "";
    isSubWhite: boolean = false;
    rules: Rule[] = new Array();

    constructor (name: string = "", rules: Rule[] = new Array()) {
        this.name = name;
        this.rules = rules;
    }

    static fromRegex(n: string, r: RegExp): SequenceRule {
        let newRule = new SequenceRule();
        newRule.name = n;
        newRule.rules.push(new RegexRule(r))
        return newRule;
    }

    static fromConstant(n: string, r: string): SequenceRule {
        let newRule = new SequenceRule();
        newRule.name = n;
        newRule.rules.push(new ConstantRule(r))
        return newRule;
    }

    toString(): string {
        let sequence = this.rules
            .map(it => it.toString())
            .join(" .. ")
        return this.name + ": " + sequence
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        if (!isLeaf) {
            index = index-1;
        }

        let sequence = this.rules
            .slice(0, index)
            .map(it => it.toString())
        let fakeResult = this.name + ": " + [ ...sequence, ""].join(" .. ")
        const anyChar = new RegExp(".", "g")
        let padding = " ".repeat(offset)
        let firstLine = padding + this.toString();
        let secondLine = padding + fakeResult.replace(anyChar, " ") + "^";
        return new StringPathResult (
            firstLine,
            secondLine.length - 1
        )
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO | undefined): MatchResult {
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


class IterationExpansions {
    pushChildWithoutMe = false;
    pushChildWithMe = false;
    pushJustBase = false;
}

export class IterationRule implements Rule {
    iterationType: IterationType = IterationType.ZeroOrMore;
    rule: RuleRef = new RuleRef("");

    constructor(n: string, type: IterationType) {
        this.iterationType = type;
        this.rule = new RuleRef(n)
    }

    determineTypeOperator() {
        switch(this.iterationType) {
            case IterationType.ZeroOrOne:
                return "?";
            case IterationType.ZeroOrMore:
                return "*";
            case IterationType.One:
                return "!";
            case IterationType.OneOrMore:
                return "+";
        }
    }

    toString(): string {
        return "[" + this.rule.toString() + "]" + this.determineTypeOperator();
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    askToFilterRules(expansions: IterationExpansions, io: IO | undefined): IterationExpansions {
        let possibleChoices = 0 +
            Number(expansions.pushChildWithMe) +
            Number(expansions.pushChildWithoutMe) +
            Number(expansions.pushJustBase);
        if (io && possibleChoices > 1) {
            io.write("How should iteration be expanded?");
            if (expansions.pushJustBase) {
                io.write("1: Zero");
            } 
            if (expansions.pushChildWithoutMe) {
                io.write("2: One");
            } 
            if (expansions.pushChildWithMe) {
                io.write("3: More");
            } 
            io.write("default: " + io.defaultAnswer());
            let answer = parseInt(io.question("? ", true));
            expansions.pushJustBase = expansions.pushJustBase && answer == 1;
            expansions.pushChildWithoutMe = expansions.pushChildWithoutMe && answer == 2;
            expansions.pushChildWithMe = expansions.pushChildWithMe && answer == 3;
            return expansions;
        } else {
            return expansions;
        }
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO | undefined): MatchResult {
        let myPointer = pointer.stack[pointer.stack.length - 1]

        let expand = new IterationExpansions();

        switch (this.iterationType) {
            case IterationType.One:
                expand.pushChildWithMe = false;
                expand.pushChildWithoutMe = true;
                expand.pushJustBase = false;
                break;
            case IterationType.OneOrMore:
                expand.pushChildWithMe = true;
                expand.pushChildWithoutMe = true;
                expand.pushJustBase = false;
                break;
            case IterationType.ZeroOrMore:
                expand.pushChildWithMe = true;
                expand.pushChildWithoutMe = true;
                expand.pushJustBase = true;
                break;
            case IterationType.ZeroOrOne:
                expand.pushChildWithMe = false;
                expand.pushChildWithoutMe = true;
                expand.pushJustBase = true;
                break;
        }

        let base = pointer.stack.slice(0, pointer.stack.length - 1);
        let results: PointerStack[] = new Array<PointerStack>();

        expand = this.askToFilterRules(expand, io);

        if (expand.pushJustBase) {
            results.push(
                new PointerStack(
                    base,
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        if (expand.pushChildWithoutMe) {
            results.push(
                new PointerStack(
                    [...base, new Pointer(this.rule, 0)],
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        if (expand.pushChildWithMe) {
            results.push(
                new PointerStack(
                    [...base, new Pointer(myPointer.rule, 0), new Pointer(this.rule, 0)],
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        return new MatchResult(results, MatchOutcome.Progressing);
    }
}
