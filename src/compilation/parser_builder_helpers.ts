import { RuleCompiler } from './rule_compiler'
import { SequenceRule } from '../shared/rules';
import { Grammar } from '../shared/grammar';
import { IO } from '../repl/io';
import { BnfTransform } from '../transforms/bnf_transform';
import { NullableRuleElimination } from '../transforms/nullable_elimination_transform';
import { GnfTransform } from '../transforms/gnf_transform';

export class ParserBuilderHelpers {
    static chunkGrammar(code: string): string[] {
        let lines = code.split(new RegExp('[\n\r][\n\r]*'));
        let lastLine = "";
        let result: string[] = new Array<string>();
        let capitalLetterRegex: RegExp = new RegExp('^[A-Z].*');

        lines.forEach(line => {
            if (line.match(capitalLetterRegex)) {
                result.push(lastLine);
                lastLine = line;
            } else {
                lastLine = lastLine + " " + line;
            }
        })

        return lines
    };

    static tokenizeRule(rule: string, tokenizationRegex: RegExp): string[] {
        let tokens: string[] = new Array<string>();
        let match = rule.match(tokenizationRegex);
        while (match != null && match![0] != '') {
            tokens.push(match![1])
            rule = rule.substring(match![0].length);
            match = rule.match(tokenizationRegex);
        }
        return tokens;
    };

    
    static processOneRule(name: string, ruleString: string, tokenizationRegex: RegExp): SequenceRule[] {
        let tokenizedRule = this.tokenizeRule(ruleString, tokenizationRegex);
        let compiledRules = RuleCompiler.compileRule(name, tokenizedRule);
        return compiledRules;
    }

    static processGrammar(grammarCode: string, overridenRules: Set<string>, tokenizerRegex: RegExp): SequenceRule[] {
        let chunkedRules = ParserBuilderHelpers
            .chunkGrammar(grammarCode)
            .filter(it => it != '')
        let compiledRules = chunkedRules
            .flatMap(ruleString => {
                let tokens: string[] = this.tokenizeRule(ruleString, tokenizerRegex)
                let res: SequenceRule[] = new Array<SequenceRule>();
                if (tokens.length > 1) {
                    let name = tokens[0];
                    let rule = tokens.slice(2);
                    if (!overridenRules.has(name)) {
                        res = RuleCompiler.compileRule(name, rule);
                    }
                }
                return res
            })
        return compiledRules
    }

    static performTransformsMaybe(grammar: Grammar, io: IO | undefined): Grammar {
        let performTransforms: boolean = true;
        if (io) {
            io.setCommandContext("Perform transforms?")
            io.write("Perform standard transformations? (y)")
            let answer = io.ask("? ", true)
            if (answer != "y") {
                performTransforms = false;
            }
        }

        if (performTransforms) {
            return grammar
                .bind(BnfTransform.transform)
                .bind(NullableRuleElimination.transform) 
                .bind(GnfTransform.transform)
        } else {
            return grammar;
        }
    }
}