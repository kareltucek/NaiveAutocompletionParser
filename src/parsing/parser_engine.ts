import { Grammar } from "../shared/grammar";
import { Rule } from "../shared/rules/rule_interface";
import { PointerStack, Pointer } from "./pointers";
import { MatchResult } from "./match_results";
import { Suggestion } from "./suggestion";
import { deduplicate, deduplicateSuggestions } from "../shared/utils";
import { IO } from "../cli/io";
import { Parser } from "./parser";
import { RuleRef } from "../shared/rules/rule_ref";
import { ConstantRule } from "../shared/rules/constant_rule";

export class ParserEngine {
    static startingPointers(rule: string): PointerStack[] {
        let fakeRule = new RuleRef(rule); //this is a "bit" hackish...
        let pointer = new Pointer(fakeRule, 0);
        return [ new PointerStack([pointer], 0) ];
    }

    static determineInterestingPositions(expression: string, identifierRegex: RegExp): number {
        let pos = expression.length;
        while (pos > 0 && identifierRegex.test(expression.substring(pos - 1))) {
            pos--;
        }

        return Math.min(pos, expression.length - 2);
    }

    static reportPointerStep(expression: string, pointers: PointerStack[], io: IO, note: string | undefined) {
        if (io && io.config.interactive) {
            if (pointers.length == 0) {
                io.warn("got zero pointers!");
            } else if (pointers.length > 1) {
                io.warn("got multiple pointers!");
            } else if (pointers.length == 1) {
                io.hr();
                if (note) {
                    io.write(note);
                }
                io.write(pointers[0].toStringAsPath(expression));
                let res = io.ask("");
                if (res == 'q') {
                    throw "user commanded us to quit ¯\\_(ツ)_/¯";
                }
            }
        }
    }
    
    static steps = 0;

    static progressPointer(grammar: Grammar, expression: string, p: PointerStack, interestingBeyond: number, io: IO, depth: number = 0): PointerStack[] {
        if (p.stringPosition < interestingBeyond) {
            ParserEngine.steps++;
        }
        let validPointers: PointerStack[] = [];
        let currentRule = p.stack[p.stack.length - 1].rule;
        let res = currentRule.match(expression, p, grammar, io);
        return [
            ...res.matched
                .filter(it => it.stack.length > 0)
                .map(it => { this.reportPointerStep(expression, [it], io, "Progressed"); return it })
                ,
            ...res.progressing
                .filter(it => it.stack.length > 0)
                .map(it => {this.reportPointerStep(expression, [it], io, "Progressed"); return it})
                .flatMap(it => ParserEngine.progressPointer(grammar, expression, it, interestingBeyond, io, depth+1)),
            ...res.failed
                .map(it => {this.reportPointerStep(expression, [p], io, "Failed when matching:"); return it})
                .filter(it => it.stringPosition >= interestingBeyond)
                .map(it => new PointerStack(it.stack, it.stringPosition, true))
        ]
    }

    static simplifyState(pointers: PointerStack[]): PointerStack[] {
        pointers.map(it => it.trim())
        return deduplicate(pointers);
    }

    static matchRules(parser: Parser, grammar: Grammar, expression: string, mp: PointerStack[], io: IO): PointerStack[] {
        ParserEngine.steps = 0;
        const whitespaceRegex = new RegExp('\\s');
        let cycles = 0;
        let interestingBeyond = this.determineInterestingPositions(expression, parser.identifierRegex);
        let complete = mp.filter(it => it.complete);
        let incomplete = mp.filter(it => !it.complete);
        let simplified = incomplete;
        while (incomplete.length > 0) {
            incomplete = simplified;
            let minPosition = Math.min(...incomplete.map(it => it.stringPosition));
            let needProgression = incomplete.filter(it => it.stringPosition == minPosition);
            let dontNeedProgression = incomplete.filter(it => it.stringPosition != minPosition);

            let whites = 0;
            while (whitespaceRegex.test(expression[minPosition + whites])) {
                whites++;
            }
            let shortExpression = (" " + expression).substring(minPosition + whites);

            let progressed = needProgression.flatMap(it => {
                it.stringPosition += whites;
                return ParserEngine.progressPointer(grammar, shortExpression, it, interestingBeyond, io);
            });

            complete = [...complete, ...progressed.filter(it => it.complete)];
            incomplete = [...dontNeedProgression, ...progressed.filter(it => !it.complete)];
            simplified = this.simplifyState(incomplete);

            io.debug("Parsing cycle: " + cycles + " living pointers: " + incomplete.length);
            cycles++;
        }
        io.debug(ParserEngine.steps + " steps in " + cycles + " cycles, that is " + (ParserEngine.steps / cycles) + " per cycle.");
        return complete;
    }

    static tryApplyMatchedRules(parser: Parser, expression: string, pointers: PointerStack[]): Suggestion[] {
        let suggestions = pointers.flatMap(pointer => {
            let top = pointer.stack[pointer.stack.length - 1]
            if (top.rule instanceof ConstantRule) {
                let remainingText = expression.substring(pointer.stringPosition)
                let lastToken = (top.rule as ConstantRule).token;
                let lastOriginRule = (top.rule as ConstantRule).origRule;
                if (lastToken.startsWith(remainingText) && pointer.stringPosition != expression.length) {
                    return [new Suggestion(lastToken, lastOriginRule, remainingText.length)]
                } else if (
                    pointer.stringPosition == expression.length
                    && (expression == ''
                        || expression[expression.length - 1].match(parser.continueAfterRegex)
                        || lastToken[0].match(parser.continueWithRegex)
                    )
                ) {
                    return [new Suggestion(lastToken, lastOriginRule, remainingText.length, pointer)]
                } else {
                    return [];
                }
            } else {
                return [];
            }
        })
        return deduplicateSuggestions(suggestions);
    }
}