import { ParserBuilderHelpers } from './parser_builder_helpers'
import { Grammar } from '../shared/grammar';
import { Parser } from '../parsing/parser';
import { IO } from '../cli/io';
import * as constants from '../shared/constants';
import { IOConfig } from '../cli/io_config';
import { IOProvider } from '../cli/io_provider';
import { unescapeLeadingUnderscores } from 'typescript';
import { SequenceRule } from '../shared/rules/sequence_rule';

export class ParserBuilder {
    io: IO;
    grammarString: string = "";
    overrides: SequenceRule[] = new Array<SequenceRule>;
    overridenNames: Set<string> = new Set<string>();
    grammarTokenRegex: RegExp = constants.grammarTokenRegex;
    continueAfterRegex: RegExp = constants.continueAfterRegex;
    continueWithRegex: RegExp = constants.continueWithRegex;
    identifierRegex: RegExp = constants.strictIdentifierRegex;

    constructor(io: IO) {
        this.io = io;
    }

    setContinueAfterPattern(regex: RegExp): ParserBuilder {
        this.continueAfterRegex = regex;
        return this;
    }

    setContinueWithPattern(regex: RegExp): ParserBuilder {
        this.continueWithRegex = regex;
        return this;
    }

    setGrammarTokenPattern(regex: RegExp): ParserBuilder {
        this.grammarTokenRegex = regex;
        return this;
    }

    setIdentifierPattern(regex: RegExp): ParserBuilder {
        this.identifierRegex = regex;
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
        let compiledRules = ParserBuilderHelpers.processOneRule(name, ruleString, this.grammarTokenRegex, this.io);
        compiledRules.forEach(rule => this.overrides.push(rule));
        this.overridenNames.add(name);

        return this;
    }

    build(): Parser {
        let regularRules: SequenceRule[] = ParserBuilderHelpers.processGrammar(this.grammarString, this.overridenNames, this.grammarTokenRegex, this.io);
        let overrideRules: SequenceRule[] = [...this.overrides.values()].flat();
        let grammar = Grammar.of([...regularRules, ...overrideRules]);
        let transformedGrammar = ParserBuilderHelpers.performTransformsMaybe(grammar, this.io);

        return new Parser(
            this.io,
            transformedGrammar,
            this.continueWithRegex,
            this.continueAfterRegex,
            this.identifierRegex,
        );
    }
}
