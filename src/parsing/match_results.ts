import { PointerStack } from "./pointers.js";

export class MatchResult {
    matched: PointerStack[] = [];
    progressing: PointerStack[] = [];
    failed: PointerStack[] = [];

    constructor(matched: PointerStack[], progressing: PointerStack[], failed: PointerStack[]) {
        this.matched = matched;
        this.progressing = progressing;
        this.failed = failed;
    }
}