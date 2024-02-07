import { ParserBuilderHelpers } from './parser_builder_helpers'
import { SequenceRule } from '../shared/rules';
import { Grammar } from '../shared/grammar';
import { Parser } from '../parsing/parser';
import { BnfTransform } from '../transforms/bnf_transform';
import { IO } from '../repl/io';

export class ParserBuilder {
    grammarString: string = "";
    overrides: SequenceRule[] = new Array<SequenceRule>;
    overridenNames: Set<string> = new Set<string>();
    tokenizerRegex: RegExp = RegExp('');

    setTokenizerRegex(regex: RegExp): ParserBuilder {
        this.tokenizerRegex = regex;
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

    build(io: IO | undefined = undefined): Parser {
        let regularRules: SequenceRule[] = ParserBuilderHelpers.processGrammar(this.grammarString, this.overridenNames, this.tokenizerRegex);
        let overrideRules: SequenceRule[] = [...this.overrides.values()].flat();
        let grammar = Grammar.of([...regularRules, ...overrideRules]);
        let transformedGrammar = ParserBuilderHelpers.performTransformsMaybe(grammar, io);

        return new Parser(transformedGrammar);
    }
}
