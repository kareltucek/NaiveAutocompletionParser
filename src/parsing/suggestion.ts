import { PointerStack } from "./pointers";

export class Suggestion {
    suggestion: string;
    originRule: string;
    overlap: number;
    tree: PointerStack | undefined;

    constructor(suggestion: string, origin: string, overlap: number, tree: PointerStack | undefined = undefined) {
        this.suggestion = suggestion;
        this.overlap = overlap;
        this.originRule = origin;
        this.tree = tree;
    }

    text(): string {
        return this.suggestion;
    }

    label(): string {
        const allignAt = 25;
        if ( this.suggestion.length >= allignAt ) {
            return this.suggestion + " (" + this.originRule.toLocaleLowerCase().replace("_", " ") + ")";
        } else {
            return this.suggestion + " ".repeat(allignAt - this.suggestion.length) + "(" + this.originRule.toLocaleLowerCase().replace("_", " ") + ")";
        }
    }
}