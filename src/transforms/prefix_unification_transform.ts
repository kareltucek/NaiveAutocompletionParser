import { Grammar } from "../shared/grammar";
import { IterationType } from "../shared/rules/iteration_type";
import { RuleMath } from "../shared/rule_math";
import { RuleNamer } from "../shared/rule_namer";
import { AddedRules } from "../shared/added_rules";
import { SequenceRule } from "../shared/rules/sequence_rule";
import { ConstantRule } from "../shared/rules/constant_rule";
import { RuleRef } from "../shared/rules/rule_ref";
import { deduplicate, groupByAsMap, mapOf } from "../shared/utils";
import { Rule } from "../shared/rules/rule_interface";
import { RegexRule } from "../shared/rules/regex_rule";

class RuleRecord {
    firstRule: Rule;
    hash: string;
    oldRuleName: string;
    newRuleName: string;
    expandsToOne: boolean;
    expandsToMore: boolean;

    constructor(
        firstRule: Rule,
        hash: string,
        oldRuleName: string,
        newRuleName: string,
        expandsToOne: boolean,
        expandsToMore: boolean,
    ) {
        this.firstRule = firstRule;
        this.hash = hash;
        this.oldRuleName = oldRuleName;
        this.newRuleName = newRuleName;
        this.expandsToOne = expandsToOne;
        this.expandsToMore = expandsToMore;
    }
}

export class PrefixUnificationTransform {
    private static ruleHash(rule: SequenceRule): string {
        let firstRule = rule.rules[0];
        if (firstRule instanceof ConstantRule) {
            return rule.name + "\n" + (firstRule as ConstantRule).token;
        } else if (firstRule instanceof RuleRef) {
            return rule.name + "\n&" + (firstRule as RuleRef).ref;
        } else if (firstRule instanceof RegexRule) {
            return rule.name + "\n/" + (firstRule as RegexRule).regex.source + "/";
        } else {
            return "";
        }
    }

    private static parentRuleOfHash(hash: string): string {
        return hash.split("\n")[0];
    }

    private static eligibleForUnification(rule: SequenceRule): boolean {
        if (rule.rules.length == 0) {
            return false;
        }
        let firstRule = rule.rules[0];
        return firstRule instanceof ConstantRule || firstRule instanceof RuleRef || firstRule instanceof RegexRule;
    }

    private static makePrefixIndex(rules: SequenceRule[]): Map<string, RuleRecord> {
        let duplicitRuleHashes =
            rules
                .filter(rule => PrefixUnificationTransform.eligibleForUnification(rule))
                .map(rule => PrefixUnificationTransform.ruleHash(rule));
        let allRuleHashes = deduplicate(duplicitRuleHashes);
        let rulesByHash = groupByAsMap(rules, it => PrefixUnificationTransform.ruleHash(it));
        let newRuleRecords = allRuleHashes
            .flatMap(hash => {
                let hashesRules = rulesByHash.get(hash) ?? [];
                if (hashesRules.length < 2) {
                    return [];
                } else {
                    let expandsToOne: boolean = hashesRules.find(it => it.rules.length == 1) != undefined;
                    let expandsToMore: boolean = hashesRules.find(it => it.rules.length > 1) != undefined;
                    let parentRuleName: string = PrefixUnificationTransform.parentRuleOfHash(hash)
                    let record: RuleRecord = {
                        firstRule: rulesByHash.get(hash)!![0].rules[0],
                        hash: hash,
                        oldRuleName: parentRuleName,
                        newRuleName: RuleNamer.newName(parentRuleName, "PUT"),
                        expandsToOne: expandsToOne,
                        expandsToMore: expandsToMore,
                    }
                    return [
                        record
                    ];
                }
            })
        return mapOf(newRuleRecords, it => it.hash);
    }

    private static makeNewRulePrefixes(expansionIndex: Map<string, RuleRecord>): SequenceRule[] {
        return Array.from(expansionIndex.entries())
            .flatMap(entry => {
                let record = entry[1];
                let originalRuleName = record.oldRuleName;
                let newRuleName = record.newRuleName;
                let firstRule = record.firstRule;

                let emptySuffixRule = new SequenceRule(
                    originalRuleName,
                    [firstRule]
                )
                let nonEmptySuffixRule = new SequenceRule(
                    originalRuleName,
                    [firstRule, new RuleRef(newRuleName)]
                )

                return [
                    ...(record.expandsToOne ? [emptySuffixRule] : []),
                    ...(record.expandsToMore ? [nonEmptySuffixRule] : [])
                ]
            });
    }

    private static makeNewRuleSuffixes(allRules: SequenceRule[], expansionIndex: Map<string, RuleRecord>): AddedRules<SequenceRule[]> {
        let newRules = allRules
            .map(rule => {
                if (expansionIndex.has(PrefixUnificationTransform.ruleHash(rule))) {
                    let ruleRecord = expansionIndex.get(PrefixUnificationTransform.ruleHash(rule))!!;
                    if (rule.rules.length == 1) {
                        return AddedRules.of(
                            [],
                            []
                        );
                    } else {
                        return AddedRules.of(
                            [],
                            [
                                new SequenceRule(
                                    ruleRecord.newRuleName,
                                    rule.rules.slice(1)
                                )
                            ]
                        );
                    }
                } else {
                    return AddedRules.of(
                        [rule],
                        []
                    )
                }
            }
            );
        return AddedRules.ofArray(newRules)
            .flatMap(it => AddedRules.of(it.flat()));
    }

    static deepTransform(rulesToTransform: SequenceRule[]): SequenceRule[] {
        if (rulesToTransform.length == 0) {
            return [];
        }

        let expansionIndex = PrefixUnificationTransform.makePrefixIndex(rulesToTransform);

        let newRulePrefixes = PrefixUnificationTransform.makeNewRulePrefixes(expansionIndex);
        let ruleSuffixes = PrefixUnificationTransform.makeNewRuleSuffixes(rulesToTransform, expansionIndex);

        return [
            ...newRulePrefixes, 
            ...ruleSuffixes.item, 
            ...PrefixUnificationTransform.deepTransform(ruleSuffixes.newRules)
        ];
    }

    static transform(grammar: Grammar): Grammar {
        return Grammar.of(PrefixUnificationTransform.deepTransform(grammar.allRules()));
    }
}