import { Grammar } from "../shared/grammar";
import { Suggestion } from "./suggestion";
import { ParserEngine } from "./parser_engine";
import { IO } from "../cli/io";
import { continueAfterRegex, continueWithRegex } from "../shared/constants";


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

    complete(expression: string, rule: string): Suggestion[] {
        const startTime = new Date().getTime();
        let mp = ParserEngine.startingPointers(rule);
        let matchedRules = ParserEngine.matchRules(this, this.grammar, expression, mp, this.io);
        let completePhrases = ParserEngine.tryApplyMatchedRules(this, expression, matchedRules);
        const endTime = new Date().getTime();

        return completePhrases;
    }

    setGrammar(g: Grammar) {
        this.grammar = g;
    }
}