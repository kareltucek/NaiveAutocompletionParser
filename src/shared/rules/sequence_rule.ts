import { StringPathResult } from "./string_path_result";
import { IO } from "../../cli/io";
import { MatchResult } from "../../parsing/match_results";
import { Pointer, PointerStack } from "../../parsing/pointers";
import { Grammar } from "../grammar";
import { RuleMath } from "../rule_math";
import { ConstantRule } from "./constant_rule";
import { RegexRule } from "./regex_rule";
import { Rule } from "./rule_interface";
import { RuleRef } from "./rule_ref";

export class SequenceRule implements Rule {
    name: string = "";
    firstChar: string | undefined = undefined;
    rules: Rule[] = new Array();

    constructor(name: string = "", rules: Rule[] = new Array()) {
        this.name = name;
        this.rules = rules;
        if (
            rules.length > 0
            && rules[0] instanceof ConstantRule
            && (rules[0] as ConstantRule).token.length > 0
        ) {
            this.firstChar = (rules[0] as ConstantRule).token.substring(0, 1);
        }
    }

    static of(name: string = "", rules: Rule[] = new Array()): SequenceRule {
        return new SequenceRule(name, rules);
    }

    static fromRegex(n: string, r: RegExp): SequenceRule {
        let newRule = new SequenceRule();
        newRule.name = n;
        newRule.rules.push(new RegexRule(r));
        return newRule;
    }

    static fromConstant(n: string, r: string): SequenceRule {
        let newRule = new SequenceRule();
        newRule.name = n;
        newRule.rules.push(new ConstantRule(r, n));
        if (r.length > 0) {
            newRule.firstChar = r.substring(0, 1);
        }
        return newRule;
    }

    firstRef(): string | undefined {
        if (this.rules.length > 0 && this.rules[0] instanceof RuleRef) {
            return this.rules[0].ref;
        } else {
            return undefined;
        }
    }

    simpleFlatMap(transform: (rule: Rule) => Rule[]): SequenceRule {
        let newRules = this.rules.flatMap(transform);
        return new SequenceRule(this.name, newRules);
    }


    flatMap(transform: (rule: Rule) => Rule[][]): SequenceRule[] {
        let arrayOfOptions: Rule[][][] = this.rules.map(rule => transform(rule));
        let ruleSequences = RuleMath.produce(arrayOfOptions);
        let namedRules = ruleSequences.map(sequence => new SequenceRule(this.name, sequence))
        return namedRules
    }

    toString(): string {
        let sequence = this.rules
            .map(it => it.toString())
            .join(" .. ")
        return this.name + ": " + sequence
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        if (!isLeaf) {
            index = index - 1;
        }

        let sequence = this.rules
            .slice(0, index)
            .map(it => it.toString())
        let fakeResult = this.name + ": " + [...sequence, ""].join(" .. ")
        const anyChar = new RegExp(".", "g")
        let padding = " ".repeat(offset)
        let firstLine = padding + this.toString();
        let secondLine = padding + fakeResult.replace(anyChar, " ") + "^";
        return new StringPathResult(
            firstLine,
            secondLine.length - 1
        )
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult {
        let myPointer = pointer.stack[pointer.stack.length - 1]

        if (myPointer.idx < this.rules.length) {
            // increase index and push the next rule onto stack
            let newBase = pointer.stack.slice(0, pointer.stack.length - 1)
            newBase.push(new Pointer(myPointer.rule, myPointer.idx + 1, myPointer.consumedSomething));
            newBase.push(new Pointer(this.rules[myPointer.idx], 0));
            let newStack = new PointerStack(newBase, pointer.stringPosition, pointer.complete);
            return new MatchResult([], [newStack], []);
        } else {
            // pop me from stack
            let newBase = pointer.stack.slice(0, pointer.stack.length - 1)
            let newStack = new PointerStack(newBase, pointer.stringPosition, pointer.complete);
            return new MatchResult([], [newStack], []);
        }
    }

    canTrim(idx: number, consumedSomething: boolean): boolean {
        return idx == this.rules.length && consumedSomething;
    }
}