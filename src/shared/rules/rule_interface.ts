
import { IO } from "../../cli/io";
import { MatchResult } from "../../parsing/match_results";
import { Pointer, PointerStack } from "../../parsing/pointers";
import { strictIdentifierRegex } from "../constants";
import { Grammar } from "../grammar";
import { escapeRegex, markPointersAsConsumed } from "../utils";
import { IterationType } from "./iteration_type";
import { RuleRef } from "./rule_ref";

export interface Rule {
    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult;
    canTrim(idx: number, consumedSomething: boolean): boolean;
    toString(): string;
    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult;
};
