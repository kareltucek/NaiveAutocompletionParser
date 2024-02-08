import { Grammar } from "../shared/grammar";
import { Suggestion } from "./suggestion";
import { ParserEngine } from "./parser_engine";
import { IO } from "../cli/io";
import { continueAfterRegex, continueWithRegex } from "../shared/constants";


export class Parser {
    grammar: Grammar;
    continueWithRegex: RegExp;
    continueAfterRegex: RegExp;
    identifierRegex: RegExp;

    constructor(
        g: Grammar,
        continueWithRegex: RegExp,
        continueAfterRegex: RegExp,
        identifierRegex: RegExp,
    ) {
        this.grammar = g;
        this.continueWithRegex = continueWithRegex;
        this.continueAfterRegex = continueAfterRegex;
        this.identifierRegex = identifierRegex
    }

    complete(expression: string, rule: string, io: IO | undefined = undefined): Suggestion[] {
        const startTime = new Date().getTime();
        let mp = ParserEngine.startingPointers(rule);
        let matchedRules = ParserEngine.matchRules(this, this.grammar, expression, mp, io);
        let completePhrases = ParserEngine.tryApplyMatchedRules(this, expression, matchedRules);
        const endTime = new Date().getTime();

        console.log("time: " + (endTime - startTime));

        return completePhrases;
    }

    setGrammar(g: Grammar) {
        this.grammar = g;
    }
}