import { Grammar } from "../shared/grammar";
import { Rule, ConstantRule } from "../shared/rules";
import { nonterminalRegex, strictIdentifierRegex, globalCompletionRegex, continueRegex } from "../shared/constants";
import { PointerStack, Pointer } from "./pointers";
import { MatchOutcome, MatchResult } from "./match_results";
import { Suggestion } from "./suggestion";
import { deduplicate } from "../shared/utils";
import { IO } from "../uhk_preset";
import { RuleRef } from "../shared/rules";
import exp from "constants";


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