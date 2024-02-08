import { PointerStack } from "./pointers";

export class Suggestion {
    suggestion: string;
    overlap: number;
    tree: PointerStack | undefined;

    constructor(suggestion: string, overlap: number, tree: PointerStack | undefined = undefined) {
        this.suggestion = suggestion;
        this.overlap = overlap;
        this.tree = tree;
    }
}