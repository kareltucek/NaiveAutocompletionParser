import { Grammar } from "../shared/grammar";
import { IterationType } from "../shared/rules/iteration_type";
import { RuleMath } from "../shared/rule_math";
import { RuleNamer } from "../shared/rule_namer";
import { AddedRules } from "../shared/added_rules";
import { SequenceRule } from "../shared/rules/sequence_rule";
import { ConstantRule } from "../shared/rules/constant_rule";
import { RuleRef } from "../shared/rules/rule_ref";

export class PrefixUnificationTransform {
    private static ruleHash(rule: SequenceRule): string {
        return rule.name + "\n" + (rule.rules[0] as ConstantRule).token;
    }

    private static makePrefixIndex(grammar: Grammar): Map<string, string> {
        grammar = grammar.fillCache();
        let ruleHashes = grammar
            .allRules()
            .filter(rule => rule.rules.length > 0 && rule.rules[0] instanceof ConstantRule)
            .map(rule => PrefixUnificationTransform.ruleHash(rule))
        let duplicitRuleHashes = ruleHashes
            .filter(hash => {
                let array = hash.split("\n");
                return grammar.getRuleByLookahead(array[0], array[1]).matchingRules.length > 1;
            })
        let newRulePairs: [string, string][] = duplicitRuleHashes
            .map(hash => {
                let array = hash.split("\n");
                return [hash, RuleNamer.newName(array[0], "PUT")]
            });
        return new Map(newRulePairs);
    }

    private static makeNewRules(grammar: Grammar, expansionIndex: Map<string, string>): SequenceRule[] {
        return Array.from(expansionIndex.entries())
            .map(entry => {
                let hashArray = entry[0].split("\n");
                let originalRuleName = hashArray[0];
                let firstToken = hashArray[1];
                let newRuleName = entry[1];
                let firstRule = grammar.getRuleByLookahead(originalRuleName, firstToken).matchingRules[0].rules[0];
                return new SequenceRule(
                    originalRuleName,
                    [firstRule, new RuleRef(newRuleName)]
                )
            });
    }

    private static transformRule(rule: SequenceRule, expansionIndex: Map<string, string>): SequenceRule {
        if (expansionIndex.has(PrefixUnificationTransform.ruleHash(rule))) {
            let newName = expansionIndex.get(PrefixUnificationTransform.ruleHash(rule))!!;
            return new SequenceRule(
                newName,
                rule.rules.slice(1)
            );
        } else {
            return rule;
        }
    }   

    static transform(grammar: Grammar): Grammar {
        let expansionIndex = PrefixUnificationTransform.makePrefixIndex(grammar);

        let newRules = PrefixUnificationTransform.makeNewRules(grammar, expansionIndex);
        let ruleSuffixes = grammar.allRules().map( rule => PrefixUnificationTransform.transformRule(rule, expansionIndex));

        return Grammar.of([...newRules, ...ruleSuffixes]);
    }
}