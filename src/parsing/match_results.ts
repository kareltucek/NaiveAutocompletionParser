import { PointerStack } from "./pointers";

export enum MatchOutcome {
    Failed,
    Matched,
    Progressing,
}

export class MatchResult {
    newPointers: PointerStack[];
    outcome: MatchOutcome

    constructor(np: PointerStack[], mo: MatchOutcome) {
        this.newPointers = np;
        this.outcome = mo;
    }
}