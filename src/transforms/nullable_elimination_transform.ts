import { Grammar } from "../shared/grammar";
import { ConstantRule, RuleRef, RegexRule, SequenceRule } from "../shared/rules";
import { AddedRules } from "../shared/added_rules";
import { RuleNamer } from "../shared/rule_namer";

// input: bnf form
// output: (nullable) sequences of references

export class NullableRuleElimination {
    static determineNullables(grammar: Grammar): Set<string> {
        let allNames = new Set(grammar.rules.keys());
        let nullableNames = new Set<string>();
        let changed = true;
        while (changed) {
            changed = false;
            let maybeNullableNames = Array.from(allNames).filter(it => !nullableNames.has(it))
            maybeNullableNames
                .flatMap(it => grammar.getRule(it))
                .forEach(rule => {
                    let hasNonNullable = false;
                    rule.rules.forEach(subRule => {
                        if (
                            !(subRule instanceof RuleRef)
                            || !nullableNames.has(subRule.ref)
                        ) {
                            hasNonNullable = true;
                        }
                    })
                    if (!hasNonNullable && !nullableNames.has(rule.name)) {
                        nullableNames.add(rule.name);
                    }
                });
        }
        return nullableNames;
    }

    static eliminateNullablesTransform(nullables: Set<string>): (rule: SequenceRule) => AddedRules<SequenceRule[]> {
        return sequenceRule => {
            let r = AddedRules.of(
                sequenceRule.flatMap(rule =>
                    (rule instanceof RuleRef && nullables.has(rule.ref)) ? [[], [rule]] : [[rule]]
                )
            );
            return r;
                };
    }

    static eliminateNullRules(rule: SequenceRule): AddedRules<SequenceRule[]> {
        if (rule.rules.length > 0) {
            return AddedRules.of([rule]);
        } else {
            return AddedRules.of([]);
        }
    }

    static transform(grammar: Grammar): Grammar {
        let nullables = NullableRuleElimination.determineNullables(grammar);
        return grammar
            .transform(NullableRuleElimination.eliminateNullablesTransform(nullables))
            .transform(NullableRuleElimination.eliminateNullRules)
    }
}