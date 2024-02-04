import { ParserBuilderHelpers } from './parser_builder_helpers'
import { ReferencableRule, SequenceRule } from './data_types/rules';
import { groupBy } from './utils'
import { Grammar } from './data_types/grammar';
import { Parser } from './parser';

export class ParserBuilder {
    grammar: string = "";
    overrides: ReferencableRule[] = new Array<ReferencableRule>;
    overridenNames: Set<string> = new Set<string>();
    tokenizerRegex: RegExp = RegExp('');

    setTokenizerRegex(regex: RegExp): ParserBuilder {
        this.tokenizerRegex = regex;
        return this;
    }

    addRule(code: string): ParserBuilder {
        this.grammar = this.grammar + "\n" + code;
        return this;
    }

    overrideRuleWithRegex(name: string, regex: string): ParserBuilder {
        this.overrides.push(SequenceRule.fromRegex(name, new RegExp(regex)));
        this.overridenNames.add(name);

        return this;
    }
    
    build(): Parser {
        let grammar = new Grammar;
        let regularRules: ReferencableRule[] = ParserBuilderHelpers.processGrammar(this.grammar, this.overridenNames, this.tokenizerRegex);
        let overrideRules: ReferencableRule[] = [...this.overrides.values()].flat();
        let grouped = groupBy([...regularRules, ...overrideRules], rule => rule.name);

        grammar.rules = new Map(Object.entries(grouped));

        return new Parser(grammar);
    }
}
