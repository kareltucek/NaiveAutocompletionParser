import { PointerStack, Pointer } from "../parsing/pointers";
import { MatchResult } from "../parsing/match_results";
import { Grammar} from "./grammar";
import { IterationType } from "./iteration_type";
import { escapeRegex, markPointersAsConsumed } from "./utils";
import { strictIdentifierRegex, maxRecursionDepth } from "./constants";
import { IO } from "../cli/io";
import { RuleMath } from "./rule_math";
import * as constants from "../shared/constants"
import { GrammarLookupResult } from "./grammar_lookup_result";

class StringPathResult {
    str: string;
    offset: number;

    constructor(str: string, offset: number) {
        this.str = str;
        this.offset = offset;
    }
}

export interface Rule {
    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult;
    canTrim(idx: number, consumedSomething: boolean): boolean;
    toString(): string;
    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult;
};

export class RegexRule implements Rule {
    regex: RegExp;

    constructor(r: RegExp) {
        let modified = r.source.replace(new RegExp('^\\^'), '');
        this.regex = new RegExp(`^.${modified}`);
    }

    toString(): string {
        return this.regex.toString() 
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult {
        let res = expression.match(this.regex)
        if (res) {
            // pop me from stack and increment string position
            let newStack = pointer.stack.slice(0, pointer.stack.length - 1);
            let markedStack = markPointersAsConsumed(newStack);
            let newPointer = new PointerStack(markedStack, pointer.stringPosition + res[0].length - 1);
            return new MatchResult([newPointer], [], []);
        } else {
            return new MatchResult([], [], [pointer]);
        }
    }

    canTrim(idx: number, consumedSomething: boolean): boolean {
        return consumedSomething;
    }
}

export class ConstantRule implements Rule {
    token: string;
    regex: RegExp;
    origRule: string;

    constructor(t: string, origin: string) {
        this.token = t;
        this.origRule = origin;
        let escapedString = escapeRegex(t)
        if (t.match(strictIdentifierRegex)) {
            this.regex = new RegExp("^.\\b" + escapedString + "\\b");
        } else {
            this.regex = new RegExp("^." + escapedString + "");
        }
    }

    toString(): string {
        return '"' + this.token + '"'
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        return new StringPathResult(
            " ".repeat(offset) + this.toString(),
            offset
        );
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult {
        if (expression.match(this.regex)) {
            // pop me from stack and increment string position
            let newStack = pointer.stack.slice(0, pointer.stack.length - 1);
            let markedStack = markPointersAsConsumed(newStack);
            let newPointer = new PointerStack(markedStack, pointer.stringPosition + this.token.length);

            return new MatchResult([newPointer], [], []);
        } else {
            // fail
            return new MatchResult([], [], [pointer]);
        }
    }

    canTrim(idx: number, consumedSomething: boolean): boolean {
        return consumedSomething;
    }
}

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

                if (lookaheadMatch && lookaheadMatch[1] != '') {
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

export class SequenceRule implements Rule {
    name: string = "";
    firstChar: string | undefined = undefined;
    rules: Rule[] = new Array();

    constructor(name: string = "", rules: Rule[] = new Array()) {
        this.name = name;
        this.rules = rules;
        if (
            rules.length > 0
            && rules[0] instanceof ConstantRule
            && (rules[0] as ConstantRule).token.length > 0
        ) {
            this.firstChar = (rules[0] as ConstantRule).token.substring(0, 1);
        }
    }

    static of(name: string = "", rules: Rule[] = new Array()): SequenceRule {
        return new SequenceRule(name, rules);
    }

    static fromRegex(n: string, r: RegExp): SequenceRule {
        let newRule = new SequenceRule();
        newRule.name = n;
        newRule.rules.push(new RegexRule(r));
        return newRule;
    }

    static fromConstant(n: string, r: string): SequenceRule {
        let newRule = new SequenceRule();
        newRule.name = n;
        newRule.rules.push(new ConstantRule(r, n));
        if (r.length > 0) {
            newRule.firstChar = r.substring(0, 1);
        }
        return newRule;
    }

    firstRef(): string | undefined {
        if (this.rules.length > 0 && this.rules[0] instanceof RuleRef) {
            return this.rules[0].ref;
        } else {
            return undefined;
        }
    }

    simpleFlatMap(transform: (rule: Rule) => Rule[]): SequenceRule {
        let newRules = this.rules.flatMap(transform);
        return new SequenceRule(this.name, newRules);
    }


    flatMap(transform: (rule: Rule) => Rule[][]): SequenceRule[] {
        let arrayOfOptions: Rule[][][] = this.rules.map(rule => transform(rule));
        let ruleSequences = RuleMath.produce(arrayOfOptions);
        let namedRules = ruleSequences.map(sequence => new SequenceRule(this.name, sequence))
        return namedRules
    }

    toString(): string {
        let sequence = this.rules
            .map(it => it.toString())
            .join(" .. ")
        return this.name + ": " + sequence
    }

    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult {
        if (!isLeaf) {
            index = index - 1;
        }

        let sequence = this.rules
            .slice(0, index)
            .map(it => it.toString())
        let fakeResult = this.name + ": " + [...sequence, ""].join(" .. ")
        const anyChar = new RegExp(".", "g")
        let padding = " ".repeat(offset)
        let firstLine = padding + this.toString();
        let secondLine = padding + fakeResult.replace(anyChar, " ") + "^";
        return new StringPathResult(
            firstLine,
            secondLine.length - 1
        )
    }

    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult {
        let myPointer = pointer.stack[pointer.stack.length - 1]

        if (myPointer.idx < this.rules.length) {
            // increase index and push the next rule onto stack
            let newBase = pointer.stack.slice(0, pointer.stack.length - 1)
            newBase.push(new Pointer(myPointer.rule, myPointer.idx + 1, myPointer.consumedSomething));
            newBase.push(new Pointer(this.rules[myPointer.idx], 0));
            let newStack = new PointerStack(newBase, pointer.stringPosition, pointer.complete);
            return new MatchResult([], [newStack], []);
        } else {
            // pop me from stack
            let newBase = pointer.stack.slice(0, pointer.stack.length - 1)
            let newStack = new PointerStack(newBase, pointer.stringPosition, pointer.complete);
            return new MatchResult([], [newStack], []);
        }
    }

    canTrim(idx: number, consumedSomething: boolean): boolean {
        return idx == this.rules.length && consumedSomething;
    }
}


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
