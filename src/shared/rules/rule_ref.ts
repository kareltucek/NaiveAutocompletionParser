import { StringPathResult } from "./string_path_result";
import { IO } from "../../cli/io";
import { MatchResult } from "../../parsing/match_results";
import { Pointer, PointerStack } from "../../parsing/pointers";
import { maxRecursionDepth, strictIdentifierRegex } from "../constants";
import { Grammar } from "../grammar";
import { markPointersAsConsumed } from "../utils";
import { ConstantRule } from "./constant_rule";
import { Rule } from "./rule_interface";
import { SequenceRule } from "./sequence_rule";
import * as constants from "../constants";
import { GrammarLookupResult } from "../grammar_lookup_result";

export class RuleRef implements Rule {
    ref: string;

    constructor(n: string) {
        this.ref = n;
    }

    static of(n: string): RuleRef {
        return new RuleRef(n);
    }

    toString(): string {
        return "&" + this.ref
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    isSameRuleByName(rule: Rule): boolean {
        if (rule instanceof SequenceRule && (rule as SequenceRule).name == this.ref) {
            return true;
        }
        return false;
    }

    canExpandMyself(parentPointers: Pointer[]): boolean {
        let similarNonexpandedAncestorsFound = 0;
        for (let i = 0; i < parentPointers.length; i++) {
            let pointer = parentPointers[i];
            if (!pointer.consumedSomething && this.isSameRuleByName(pointer.rule)) {
                similarNonexpandedAncestorsFound++;
            }
        }
        return similarNonexpandedAncestorsFound <= maxRecursionDepth;
    }

    askToFilterRules(rules: SequenceRule[], grammar: Grammar, io: IO): SequenceRule[] {
        if (io.config.interactive && rules.length > 1) {
            let question = "Which rule should I expand?"
            let options = rules
                .flatMap((rule, index) => { 
                    let firstLine = [index + ": " + rule.toString()]
                    let expansions: string[] = [];
                    if (rule instanceof SequenceRule && rule.firstRef()) {
                        expansions = grammar.getRule(rule.firstRef()!!)
                            .map(it => "        " + it.toString());
                    }
                    return [...firstLine, ...expansions];
                })
                .join("\n")
            io.write(question);
            io.write(options);
            let answerString = io.ask("? ", true);
            if (answerString == 'q') {
                return [];
            }
            let answer = parseInt(answerString);
            return [rules[answer]];
        } else {
            return rules;
        }
    }

    expandRules(rules: SequenceRule[], pointer: PointerStack, myPointer: Pointer, matchedFirstToken: boolean): PointerStack[] {
        let base = pointer.stack.slice(0, pointer.stack.length - 1);

        return rules.map(rule => {
            let tokenLength = matchedFirstToken && rule.rules[0] instanceof ConstantRule ? rule.rules[0].token.length : 0;
            let newPointerStack = [
                    ...base,
                    new Pointer(myPointer.rule, 1),
                    new Pointer(rule, matchedFirstToken ? 1 : 0),
                ];
            return new PointerStack(
                matchedFirstToken ? markPointersAsConsumed(newPointerStack) : newPointerStack,
                pointer.stringPosition + tokenLength,
                pointer.complete
            )
        }
        )
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult {
        let myPointer = pointer.stack[pointer.stack.length-1]
        let base = pointer.stack.slice(0, pointer.stack.length - 1);

        if (myPointer.idx == 0) {
            if (grammar.isInGnf || this.canExpandMyself(base)) {
                let lookaheadMatch = expression.match(new RegExp(`^.(${constants.identifierRegex.source})`));
                let lookupResult: GrammarLookupResult;

                if (lookaheadMatch && lookaheadMatch[1] != '' && lookaheadMatch[1].length < expression.length - 1) {
                    lookupResult = grammar.getRuleByLookahead(this.ref, lookaheadMatch[1]);
                } else {
                    lookupResult = GrammarLookupResult.of([], grammar.getRule(this.ref));
                }

                if (io.config.interactive) {
                    let pickedRuleMaybe = this.askToFilterRules([...lookupResult.matchingRules, ...lookupResult.maybeMatchingRules], grammar, io);
                    if (pickedRuleMaybe.length == 0) {
                        return new MatchResult([],[],[]);
                    } else if (lookupResult.matchingRules.find(it => it == pickedRuleMaybe[0])) {
                        return new MatchResult(
                            this.expandRules(pickedRuleMaybe, pointer, myPointer, true),
                            [],
                            []
                        );
                    } else {
                        return new MatchResult(
                            [],
                            this.expandRules(pickedRuleMaybe, pointer, myPointer, false),
                            []
                        );
                    }
                } else {
                    let matchedExpandedPointers = this.expandRules(lookupResult.matchingRules, pointer, myPointer, true);
                    let nonmatchedExpandedPointers = this.expandRules(lookupResult.maybeMatchingRules, pointer, myPointer, false);

                    return new MatchResult(matchedExpandedPointers, nonmatchedExpandedPointers, []);
                }
            }
        } else {
            // pop me from stack
            let base = pointer.stack.slice(0, pointer.stack.length - 1);
            return new MatchResult(
                [],
                [
                    new PointerStack(
                        [...base],
                        pointer.stringPosition,
                        pointer.complete
                    )
                ],
                []
            )
        }
        return new MatchResult([], [], [pointer]);
    }

    canTrim(idx: number, consumedSomething: boolean): boolean {
        return idx == 1 && consumedSomething;
    }
}