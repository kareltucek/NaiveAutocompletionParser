import { Rule, SequenceRule, RuleRef, RegexRule, ConstantRule, IterationRule } from '../shared/rules'

export interface Stackable { }

export class StackToken implements Stackable {
    token: string;

    constructor(t: string) {
        this.token = t
    }

    toString(): string {
        return "token: '" + this.token + "'"
    }
}

export class StackRule implements Stackable {
    rule: Rule;

    constructor(r: Rule) {
        this.rule = r;
    }

    toString(): string {
        return "rule: " + this.rule.toString()
    }
}