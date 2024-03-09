import { IO } from "../../cli/io.js";
import { MatchResult } from "../../parsing/match_results.js";
import { PointerStack } from "../../parsing/pointers.js";
import { Grammar } from "../grammar.js";
import { StringPathResult } from "./string_path_result.js";

export interface Rule {
    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult;
    canTrim(idx: number, consumedSomething: boolean): boolean;
    toString(): string;
    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult;
};
