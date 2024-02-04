import * as regexPatterns from './data_types/constants'
import { Rule, ReferencableRule, RuleRef, RegexRule, ConstantRule, SequenceRule, IterationRule } from './data_types/rules'
import { Stackable, StackToken, StackRule } from './data_types/stackables'
import { IterationType } from './data_types/iteration_type';


export class RuleCompiler {
    newRules: ReferencableRule[] = new Array<ReferencableRule>();
    stack: Stackable[] = new Array<Stackable>();
    tokens: string[]
    idx: number = 0;
    static nameIdx: number = 0;

    constructor(toks: string[]) {
        this.tokens = toks;
        this.idx = 0;
        this.newRules = new Array<ReferencableRule>();
        this.stack = new Array<Stackable>();
    }

    newName(base: string, tag: string): string {
        let id = RuleCompiler.nameIdx++;
        return base.toUpperCase() + "_" + tag.toUpperCase() + "_" + "ID" + id;
    }

    processHumanDescription(token: string): Stackable {
        let m = token.match(regexPatterns.strictHumanRegex);
        return new StackRule(new RuleRef(m![2], m![1]));
    }

    isSequenceableAt(idx: number): boolean {
        if (this.stack[idx] instanceof StackToken) {
            return false;
        }
        if (this.stack[idx] instanceof StackRule && (this.stack[idx] as StackRule).rule instanceof SequenceRule) {
            return false;
        }
        return true
    }

    isSequenceRuleAt(idx: number): boolean {
        if (this.stack[idx] instanceof StackToken) {
            return false;
        }
        if (this.stack[idx] instanceof StackRule && (this.stack[idx] as StackRule).rule instanceof SequenceRule) {
            return true;
        }
        return false;
    }

    isStringAt(idx: number, s: string): boolean {
        if (this.stack[idx] instanceof StackToken && (this.stack[idx] as StackToken).token == s) {
            return true;
        }
        return false;
    }

    squashSequence() {
        let start = this.stack.length;

        while (start > 0 && this.isSequenceableAt(start - 1)) {
            start--;
        }

        if (start == this.stack.length) {
            console.log("expected sequence, not found anything?");
        }

        let newRule = new SequenceRule();

        for (let i = start; i < this.stack.length; i++) {
            newRule.rules.push((this.stack[i] as StackRule).rule);
        }

        while (this.stack.length > start) {
            this.stack.pop();
        }

        this.stack.push(new StackRule(newRule));
    }

    squashChoice(name: string) {
        let top = this.stack.length - 1;
        while (top >= 0 && this.stack[top] instanceof StackRule && this.isSequenceRuleAt(top)) {
            let rule: SequenceRule = (this.stack[top] as StackRule).rule as SequenceRule;
            rule.name = name;
            this.newRules.push(rule);
            this.stack.pop();
            top--;
        }
    }

    squashIteration(baseName: string, tag: string, type: IterationType, stopperToken: string) {
        let ruleName = this.newName(baseName, tag);
        this.squashSequence();
        this.squashChoice(ruleName);
        if (this.isStringAt(this.stack.length - 1, stopperToken)) {
            this.stack.pop();
        } else {
            console.log("expected " + stopperToken + " on top of stack!");
        }
        this.stack.push(new StackRule(new IterationRule(ruleName, type)));
    }

    compile(name: string): ReferencableRule[] {
        let dbg = 666
        while (this.idx < this.tokens.length) {
            switch (this.tokens[this.idx]) {
                case "|":
                    this.squashSequence();
                    this.idx++;
                    break;
                case "{":
                    this.stack.push(new StackToken("{"));
                    this.idx++;
                    break;
                case "}":
                    this.squashIteration(name, "group", IterationType.One, "{");
                    this.idx++;
                    break;
                case "[":
                    this.stack.push(new StackToken("["));
                    this.idx++;
                    break;
                case "]":
                    this.squashIteration(name, "option", IterationType.ZeroOrOne, "[");
                    this.idx++;
                    break;
                case "]?":
                    this.squashIteration(name, "option", IterationType.ZeroOrOne, "[");
                    this.idx++;
                    break;
                case "]+":
                    this.squashIteration(name, "iter", IterationType.OneOrMore, "[");
                    this.idx++;
                    break;
                case "]*":
                    this.squashIteration(name, "iter", IterationType.ZeroOrMore, "[");
                    this.idx++;
                    break;
                default:
                    if (regexPatterns.strictHumanRegex.test(this.tokens[this.idx])) {
                        this.stack.push(this.processHumanDescription(this.tokens[this.idx]));
                        this.idx++;
                    } else if (regexPatterns.strictRegexRegex.test(this.tokens[this.idx])) {
                        let regexString = this.tokens[this.idx].substring(1, this.tokens[this.idx].length - 1);
                        let regex = new RegExp(regexString);
                        this.stack.push(new StackRule(new RegexRule(regex)));
                        this.idx++;
                    } else if (regexPatterns.strictNonterminalRegex.test(this.tokens[this.idx])) {
                        this.stack.push(new StackRule(new RuleRef(this.tokens[this.idx])));
                        this.idx++;
                    } else {
                        this.stack.push(new StackRule(new ConstantRule(this.tokens[this.idx])));
                        this.idx++;
                    }
            }
        }

        this.squashSequence();
        this.squashChoice(name);
        return this.newRules;
    }

    stackString(): string {
        let values = this.stack.map(it => it.toString()).join(", ")
        return "[" + values + "]"
    }

    newRuleString(): string {
        let values = this.newRules.map(it => it.toString()).join(", ")
        return "[" + values + "]"
    }

    static compileRule(name: string, tokens: string[]): ReferencableRule[] {
        let compiler = new RuleCompiler(tokens);
        return compiler.compile(name);
    }
}