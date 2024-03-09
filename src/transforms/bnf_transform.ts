import { Grammar } from "../shared/grammar.js";
import { IterationType } from "../shared/rules/iteration_type.js";
import { RuleNamer } from "../shared/rule_namer.js";
import { AddedRules } from "../shared/added_rules.js";
import { Rule } from "../shared/rules/rule_interface.js";
import { IterationRule } from "../shared/rules/iteration_rule.js";
import { SequenceRule } from "../shared/rules/sequence_rule.js";
import { RuleRef } from "../shared/rules/rule_ref.js";

export class BnfTransform {
    private static expandChild(rule: Rule): AddedRules<Rule> {
        if (rule instanceof IterationRule) {
            let iterationRule = rule as IterationRule
            switch (rule.iterationType) {
                case IterationType.One: 
                    return AddedRules.of(iterationRule.ruleRef);
                case IterationType.OneOrMore:
                    return RuleNamer.newNameFor("BNF", "", (newName) => {
                        return AddedRules.of(
                            RuleRef.of(newName),
                            [
                                SequenceRule.of(newName, [iterationRule.ruleRef]),
                                SequenceRule.of(newName, [iterationRule.ruleRef, RuleRef.of(newName)]),
                            ]
                        )
                    })
                case IterationType.ZeroOrMore:
                    return RuleNamer.newNameFor("BNF", "", (newName) => {
                        return AddedRules.of(
                            RuleRef.of(newName),
                            [
                                SequenceRule.of(newName, []),
                                SequenceRule.of(newName, [iterationRule.ruleRef, RuleRef.of(newName)]),
                            ]
                        )
                    })
                case IterationType.ZeroOrOne:
                    return RuleNamer.newNameFor("BNF", "", (newName) => {
                        return AddedRules.of(
                            RuleRef.of(newName),
                            [
                                SequenceRule.of(newName, []),
                                SequenceRule.of(newName, [iterationRule.ruleRef]),
                            ]
                        )
                    })
            }
        } else {
            return AddedRules.of(rule);
        }
    }

    private static transformRule(sequenceRule: SequenceRule): AddedRules<SequenceRule[]> {
        return AddedRules.ofArray(sequenceRule.rules.map(BnfTransform.expandChild))
            .map(expandedSequence => [ SequenceRule.of(sequenceRule.name, expandedSequence) ])
    }   

    static transform(grammar: Grammar): Grammar {
        return grammar.transform(BnfTransform.transformRule)
    }
}