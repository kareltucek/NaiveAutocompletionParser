import { Grammar } from "../shared/grammar";
import { IterationType } from "../shared/rules/iteration_type";
import { RuleMath } from "../shared/rule_math";
import { RuleNamer } from "../shared/rule_namer";
import { AddedRules } from "../shared/added_rules";
import { groupBy } from "../shared/utils";
import { first } from "lodash";
import { SequenceRule } from "../shared/rules/sequence_rule";
import { RuleRef } from "../shared/rules/rule_ref";

export class GnfTransform {
    static isNoOpRule(rule: SequenceRule) {
        return rule.rules.length == 1
            && rule.rules[0] instanceof RuleRef
            && rule.name == rule.rules[0].ref;
    }

    static noOpTransform(grammar: Grammar): Grammar {
        return Grammar.of(grammar.allRules().filter(it => !GnfTransform.isNoOpRule(it)))
    }

    static isLeftRecursive(rule: SequenceRule): boolean {
        return rule.rules[0] instanceof RuleRef && rule.name == rule.rules[0].ref
    }

    static eliminateRecursion(lr: SequenceRule, grammar: Grammar) {
        let rules = grammar.getRule(lr.name);

        grammar.removeRule(lr);

        if (GnfTransform.isNoOpRule(lr)) {
            return;
        }

        let otherRules = rules.filter(it => it != lr);
        let newName = RuleNamer.newName("LRE", "");
        let rr = [
            SequenceRule.of(
                newName,
                [...lr.rules.slice(1)]
            ),
            SequenceRule.of(
                newName,
                [...lr.rules.slice(1), RuleRef.of(newName)]
            ),
        ];
        let newOthers = otherRules.map(other =>
            SequenceRule.of(
                lr.name,
                [...other.rules, RuleRef.of(newName)]
            )
        );
        
        let newRules = [...otherRules, ...newOthers, ...rr];
        newRules.forEach(it => grammar.addRule(it));
        newRules.forEach(it => {
            if (GnfTransform.isLeftRecursive(it)) {
                this.eliminateRecursion(it, grammar);
            }
        })
    }

    static expandFirstNonterminal(seqRule: SequenceRule, grammar: Grammar) {
        let firstRule = seqRule.rules[0]

        if (firstRule instanceof RuleRef) {
            let replacementRules = grammar.getRule(firstRule.ref)
            let newRules = replacementRules.map(childRule => {
                let expandedRule = SequenceRule.of(
                    seqRule.name,
                    [...childRule.rules, ...seqRule.rules.slice(1)]
                );
                return expandedRule;
            });
            grammar.removeRule(seqRule);
            newRules.forEach(it => grammar.addRule(it));
        }
    }

    static pass1(tokenId: (token: string) => number, grammar: Grammar) {
        let rule = grammar.findRule(it => it.firstRef() != undefined && tokenId(it.name) >= tokenId(it.firstRef()!!));
        while (rule) {
            if (tokenId(rule.name) == tokenId(rule.firstRef()!!)) {
                GnfTransform.eliminateRecursion(rule, grammar);
            } else {
                GnfTransform.expandFirstNonterminal(rule, grammar);
            }
            rule = grammar.findRule(it => it.firstRef() != undefined && tokenId(it.name) >= tokenId(it.firstRef()!!));
        }
    }

    static pass2(tokenId: (token: string) => number, grammar: Grammar) {
        let rule = grammar.findRule(it => it.rules[0] instanceof RuleRef);
        while (rule) {
            if (rule.name == rule.firstRef()) {
                GnfTransform.eliminateRecursion(rule, grammar);
            } else {
                GnfTransform.expandFirstNonterminal(rule, grammar);
            }
            rule = grammar.findRule(it => it.rules[0] instanceof RuleRef);
        }
    }

    static transform(grammar: Grammar): Grammar {
        let allNames = Array.from(grammar.rules.keys());
        let nameMap = new Map<string, number>();
        allNames.forEach((item, index) => nameMap.set(item, index));

        GnfTransform.pass1((it: string) => nameMap.get(it)!!, grammar);
        GnfTransform.pass2((it: string) => nameMap.get(it)!!, grammar);

        return grammar;
    }
}