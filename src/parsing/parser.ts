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
        const startTime = new Date().getTime();
        let mp = ParserEngine.startingPointers(rule);
        let matchedRules = ParserEngine.matchRules(this.grammar, expression, mp, io);
        let completePhrases = ParserEngine.tryApplyMatchedRules(expression, matchedRules);
        const endTime = new Date().getTime();

        console.log("time: " + (endTime - startTime));

        return completePhrases;
    }

    setGrammar(g: Grammar) {
        this.grammar = g;
    }
}