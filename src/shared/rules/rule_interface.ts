import { IO } from "../../cli/io";
import { MatchResult } from "../../parsing/match_results";
import { PointerStack } from "../../parsing/pointers";
import { Grammar } from "../grammar";
import { StringPathResult } from "./string_path_result";

export interface Rule {
    match(expression: string, pointer: PointerStack, grammar: Grammar, io: IO): MatchResult;
    canTrim(idx: number, consumedSomething: boolean): boolean;
    toString(): string;
    toStringAsPath(isLeaf: boolean, index: number, offset: number): StringPathResult;
};
