import { Grammar } from "../shared/grammar.js";
import { Suggestion } from "./suggestion.js";
import { ParserEngine } from "./parser_engine.js";
import { IO } from "../cli/io.js";


export class Parser {
    io: IO;
    grammar: Grammar;
    continueWithRegex: RegExp;
    continueAfterRegex: RegExp;
    identifierRegex: RegExp;

    constructor(
        io: IO,
        g: Grammar,
        continueWithRegex: RegExp,
        continueAfterRegex: RegExp,
        identifierRegex: RegExp,
    ) {
        this.io = io;
        this.grammar = g;
        this.continueWithRegex = continueWithRegex;
        this.continueAfterRegex = continueAfterRegex;
        this.identifierRegex = identifierRegex
    }

    complete(expression: string, rule: string, io: IO | undefined = undefined): Suggestion[] {
        const startTime = new Date().getTime();
        let mp = ParserEngine.startingPointers(rule);
        let matchedRules = ParserEngine.matchRules(this, this.grammar, expression, mp, this.io);
        let completePhrases = ParserEngine.tryApplyMatchedRules(this, expression, matchedRules);
        const endTime = new Date().getTime();

        if (io) {
            io.debug("Query took " + (endTime - startTime) + " ms.");
        }

        return completePhrases;
    }

    setGrammar(g: Grammar) {
        this.grammar = g;
    }
}