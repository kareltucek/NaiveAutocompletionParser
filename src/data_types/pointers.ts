import { Rule } from "./rules";

export class Pointer {
    rule: Rule;
    idx: number;
    consumedSomething: boolean;

    constructor(rule: Rule, index: number = 0, consumedSomething: boolean = false) {
        this.rule = rule;
        this.idx = index;
        this.consumedSomething = consumedSomething;
    }

    toString(): string {
        return "Pointer(" + this.idx + ") -> " + this.rule.toString();
    }
}

export class PointerStack {
    stack: Pointer[];
    stringPosition: number;
    complete: boolean;

    constructor(p: Pointer[], s: number, c: boolean = false) {
        this.stack = p;
        this.stringPosition = s;
        this.complete = c;
    }

    stackTracke(): string {
        return this.stack.map(it => it.toString()).join("\n")
    }

}