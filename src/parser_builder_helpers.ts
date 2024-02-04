import { RuleCompiler } from './compiler'
import { ReferencableRule } from './rule_types';

export class ParserBuilderHelpers {
    static chunkGrammar(code: string): string[] {
        let lines = code.split(new RegExp('[\n\r][\n\r]*'));
        let lastLine = "";
        let result: string[] = new Array<string>();
        let capitalLetterRegex: RegExp = new RegExp('^[A-Z].*');

        lines.forEach ( line => {
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
        while ( match != null && match![0] != '') {
            tokens.push(match![1])
            rule = rule.substring(match![0].length);
            match = rule.match(tokenizationRegex);
        }
        return tokens;
    };

    static processGrammar(grammarCode: string, overridenRules: Set<string>, tokenizerRegex: RegExp): ReferencableRule[]  {
        let chunkedRules = ParserBuilderHelpers
            .chunkGrammar(grammarCode)
            .filter(it => it != '')
        let compiledRules = chunkedRules
            .flatMap(ruleString => {
                let tokens: string[] = this.tokenizeRule(ruleString, tokenizerRegex)
                let res: ReferencableRule[] = new Array<ReferencableRule>();
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
}