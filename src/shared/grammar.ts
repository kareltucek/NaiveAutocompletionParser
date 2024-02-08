import { Rule, SequenceRule } from "./rules";
import { groupBy, rulesEqual } from "./utils";
import { AddedRules } from "./added_rules";
import { IO } from "../cli/io";

export class Grammar {
    cache: Map<string, SequenceRule[]> | undefined = undefined;
    rules: Map<string, SequenceRule[]> = new Map<string, SequenceRule[]>();

    constructor (rules: SequenceRule[]) {
        this.rules = groupBy(rules, rule => rule.name);
    }

    static of (rules: SequenceRule[]) {
        return new Grammar(rules);
    }

    fillCache(): Grammar {
        this.cache = groupBy(this.allRules(), rule => this.ruleHash(rule));
        return this;
    }

    ruleHash(rule: SequenceRule): string {
        return rule.name + '\n' + rule.firstChar ?? '';
    }

    getRule(key: string, lookahead: string | undefined = undefined): SequenceRule[] {

        if (lookahead == '') {
            lookahead = undefined;
        }
        if (lookahead == undefined) {
            return this.rules.get(key) ?? new Array<SequenceRule>();
        } else {
            if (this.cache) {
                return this.cache.get(key + "\n" + lookahead) ?? [];
            } else {
                return (this.rules.get(key) ?? new Array<SequenceRule>())
                    .filter((rule: any) => lookahead == rule.firstChar || rule.firstChar == undefined);
            }
        }
    }

    addRule(rule: SequenceRule) {
        let res = this.rules.get(rule.name) ?? [];
        if (!res.find( it => rulesEqual(it, rule))) {
            this.rules.set(rule.name, [...res, rule]);
        }
    }

    removeRule(rule: SequenceRule) {
        let res = this.rules.get(rule.name) ?? [];
        this.rules.set(rule.name, res.filter(it => it != rule));
    }

    findRule(predicate: (r: SequenceRule) => boolean): SequenceRule | undefined {
        return this.allRules().find(predicate);
    }

    allRules(): SequenceRule[] {
        let allValues: SequenceRule[] = [];
        for (const value of this.rules.values()) {
            allValues = allValues.concat(value);
        }
        return allValues;
    }

    flatMap(transform: (rule: SequenceRule) => Array<SequenceRule>): Grammar {
        let result: SequenceRule[][] = [];
        for (const rules of this.rules.values()) {
            result.push(rules.flatMap(transform))
        }
        return Grammar.of(result.flat())
    }

    bind(transform: (grammar: Grammar) => Grammar, io: IO | undefined): Grammar {
        let res = transform(this);
        let size = this.allRules().length;
        if (io) {
            io.debug("Size of grammar after transformation is " + size);
        }
        return res;
    }

    transform(transform: (rule: SequenceRule) => AddedRules<SequenceRule[]>): Grammar {
        return this.flatMap(rule =>
            AddedRules.of(rule)
                .flatMap(transform)
                .flat()
        );
    }
}
