import { BuilderEngine } from './builder_engine'
import { ReferencableRule, SequenceRule } from './rule_types';
import { groupBy } from './utils'
import { Grammar } from './grammar';

export class ParserBuilder {
    grammar: string = "";
    overrides: ReferencableRule[] = new Array<ReferencableRule>;
    overridenNames: Set<string> = new Set<string>();
    tokenizerRegex: RegExp = RegExp('');

    setTokenizerRegex(regex: RegExp): ParserBuilder {
        this.tokenizerRegex = regex;
        return this;
    }

    addGrammarRule(code: string): ParserBuilder {
        this.grammar = this.grammar + "\n" + code;
        return this;
    }

    overrideRule(name: string, regex: string): ParserBuilder {
        this.overrides.push(SequenceRule.fromRegex(name, new RegExp(regex)));
        this.overridenNames.add(name);

        return this;
    }

    build(): Grammar {
        let grammar = new Grammar;
        let regularRules: ReferencableRule[] = BuilderEngine.processGrammar(this.grammar, this.overridenNames, this.tokenizerRegex);
        let overrideRules: ReferencableRule[] = [...this.overrides.values()].flat();
        let grouped = groupBy([ ...regularRules, ...overrideRules], rule => rule.name);

        grammar.rules = new Map(Object.entries(grouped));

        return grammar;
    }
}
