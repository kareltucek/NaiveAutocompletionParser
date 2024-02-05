import { Grammar } from "../shared/grammar";
import { Suggestion } from "./suggestion";
import { ParserEngine } from "./parser_engine";
import { IO } from "../repl/io";


export class Parser {
    constructor(g: Grammar) {
        this.grammar = g;
    }

    grammar: Grammar;

    complete(expression: string, rule: string, io: IO | undefined = undefined): Suggestion[] {
        let mp = ParserEngine.startingPointers(rule);
        let matchedRules = ParserEngine.matchRules(this.grammar, expression, mp, io);
        let completePhrases = ParserEngine.tryApplyMatchedRules(expression, matchedRules);

        return completePhrases;
    }
}