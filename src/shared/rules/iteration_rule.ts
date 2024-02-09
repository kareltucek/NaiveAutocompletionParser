import { StringPathResult } from "./string_path_result";
import { IO } from "../../cli/io";
import { MatchResult } from "../../parsing/match_results";
import { Pointer, PointerStack } from "../../parsing/pointers";
import { strictIdentifierRegex } from "../constants";
import { Grammar } from "../grammar";
import { escapeRegex, markPointersAsConsumed } from "../utils";
import { IterationType } from "./iteration_type";
import { Rule } from "./rule_interface";
import { RuleRef } from "./rule_ref";


class IterationExpansions {
    pushChildWithoutMe = false;
    pushChildWithMe = false;
    pushJustBase = false;
}

export class IterationRule implements Rule {
    iterationType: IterationType = IterationType.ZeroOrMore;
    ruleRef: RuleRef = new RuleRef("");

    constructor(n: string, type: IterationType) {
        this.iterationType = type;
        this.ruleRef = new RuleRef(n)
    }

    determineTypeOperator() {
        switch (this.iterationType) {
            case IterationType.ZeroOrOne:
                return "?";
            case IterationType.ZeroOrMore:
                return "*";
            case IterationType.One:
                return "!";
            case IterationType.OneOrMore:
                return "+";
        }
    }

    toString(): string {
        return "[" + this.ruleRef.toString() + "]" + this.determineTypeOperator();
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    askToFilterRules(expansions: IterationExpansions, io: IO): IterationExpansions {
        let possibleChoices = 0 +
            Number(expansions.pushChildWithMe) +
            Number(expansions.pushChildWithoutMe) +
            Number(expansions.pushJustBase);
        if (io && io.config.interactive && possibleChoices > 1) {
            io.write("How should iteration be expanded?");
            if (expansions.pushJustBase) {
                io.write("1: Zero");
            }
            if (expansions.pushChildWithoutMe) {
                io.write("2: One");
            }
            if (expansions.pushChildWithMe) {
                io.write("3: More");
            }
            let answerString = io.ask("? ", true);
            if (answerString == 'q') {
                return new IterationExpansions();
            }
            let answer = parseInt(answerString);
            expansions.pushJustBase = expansions.pushJustBase && answer == 1;
            expansions.pushChildWithoutMe = expansions.pushChildWithoutMe && answer == 2;
            expansions.pushChildWithMe = expansions.pushChildWithMe && answer == 3;
            return expansions;
        } else {
            return expansions;
        }
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult {
        let myPointer = pointer.stack[pointer.stack.length - 1]

        let expand = new IterationExpansions();

        switch (this.iterationType) {
            case IterationType.One:
                expand.pushChildWithMe = false;
                expand.pushChildWithoutMe = true;
                expand.pushJustBase = false;
                break;
            case IterationType.OneOrMore:
                expand.pushChildWithMe = true;
                expand.pushChildWithoutMe = true;
                expand.pushJustBase = false;
                break;
            case IterationType.ZeroOrMore:
                expand.pushChildWithMe = true;
                expand.pushChildWithoutMe = true;
                expand.pushJustBase = true;
                break;
            case IterationType.ZeroOrOne:
                expand.pushChildWithMe = false;
                expand.pushChildWithoutMe = true;
                expand.pushJustBase = true;
                break;
        }

        let base = pointer.stack.slice(0, pointer.stack.length - 1);
        let results: PointerStack[] = new Array<PointerStack>();

        expand = this.askToFilterRules(expand, io);

        if (expand.pushJustBase) {
            results.push(
                new PointerStack(
                    base,
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        if (expand.pushChildWithoutMe) {
            results.push(
                new PointerStack(
                    [...base, new Pointer(this.ruleRef, 0)],
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        if (expand.pushChildWithMe) {
            results.push(
                new PointerStack(
                    [...base, new Pointer(myPointer.rule, 0), new Pointer(this.ruleRef, 0)],
                    pointer.stringPosition,
                    pointer.complete
                )
            )
        }

        return new MatchResult([], results, []);
    }

    canTrim(idx: number, consumedSomething: boolean): boolean {
        return false;
    }
}