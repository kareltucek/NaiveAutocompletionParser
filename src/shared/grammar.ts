import { Rule } from "./rules";

export class Grammar {
    rules: Map<string, Rule[]> = new Map<string, Rule[]>();

    getRule(key: string, lookahead: string | undefined = undefined): Rule[] {
        if (lookahead == '') {
            lookahead = undefined;
        }
        if (lookahead == undefined) {
            return this.rules.get(key) ?? new Array<Rule>();
        } else {
            return (this.rules.get(key) ?? new Array<Rule>())
                .filter((rule: any) => lookahead == rule.firstChar || rule.firstChar == undefined);
        }
    }
}
