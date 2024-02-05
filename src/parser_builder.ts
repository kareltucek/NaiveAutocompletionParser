import { ParserBuilderHelpers } from './parser_builder_helpers'
import { ReferencableRule, SequenceRule } from './data_types/rules';
import { groupBy } from './utils'
import { Grammar } from './data_types/grammar';
import { Parser } from './parser';

export class ParserBuilder {
    grammarString: string = "";
    overrides: ReferencableRule[] = new Array<ReferencableRule>;
    overridenNames: Set<string> = new Set<string>();
    subWhiteRules: Set<string> = new Set<string>();
    tokenizerRegex: RegExp = RegExp('');

    setTokenizerRegex(regex: RegExp): ParserBuilder {
        this.tokenizerRegex = regex;
        return this;
    }

    setSubWhiteRule(rule: string): ParserBuilder {
        this.subWhiteRules.add(rule);
        return this;
    }

    addRule(code: string): ParserBuilder {
        this.grammarString = this.grammarString + "\n" + code;
        return this;
    }

    overrideRuleWithRegex(name: string, regex: string): ParserBuilder {
        this.overrides.push(SequenceRule.fromRegex(name, new RegExp(regex)));
        this.overridenNames.add(name);

        return this;
    }

    overrideRuleWithConstantString(name: string, rule: string): ParserBuilder {
        this.overrides.push(SequenceRule.fromConstant(name, rule));
        this.overridenNames.add(name);

        return this;
    }

    overrideRule(name: string, ruleString: string): ParserBuilder {
        let compiledRules = ParserBuilderHelpers.processOneRule(name, ruleString, this.tokenizerRegex);
        compiledRules.forEach(rule => this.overrides.push(rule));
        this.overridenNames.add(name);

        return this;
    }

    build(): Parser {
        let grammar = new Grammar;
        let regularRules: ReferencableRule[] = ParserBuilderHelpers.processGrammar(this.grammarString, this.overridenNames, this.tokenizerRegex);
        let overrideRules: ReferencableRule[] = [...this.overrides.values()].flat();
        let allRules = [...regularRules, ...overrideRules]
            .map(it => { (it as SequenceRule).isSubWhite = this.subWhiteRules.has(it.name); return it });
        let grouped = groupBy(allRules, rule => rule.name);

        grammar.rules = new Map(Object.entries(grouped));

        return new Parser(grammar);
    }
}
