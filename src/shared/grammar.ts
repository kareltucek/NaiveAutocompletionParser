import { Rule } from "./rules";

export class Grammar {
    rules: Map<string, Rule[]> = new Map<string, Rule[]>();

    getRule(key: string): Rule[] {
        return this.rules.get(key) ?? new Array<Rule>();
    }
}
