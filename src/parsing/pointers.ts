import { Rule } from "../shared/rules/rule_interface";

export class Pointer {
    rule: Rule;
    idx: number;
    consumedSomething: boolean;

    constructor(rule: Rule, index: number, consumedSomething: boolean = false) {
        this.rule = rule;
        this.idx = index;
        this.consumedSomething = consumedSomething;
    }

    toString(): string {
        return "Pointer(" + this.idx + ") -> " + this.rule.toString();
    }

    canTrim(): boolean {
        return this.rule.canTrim(this.idx, this.consumedSomething);
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

    toStringAsPath(expression: string): string {
        let expressionLine = expression + "\n";

        let offset = 0;
        let accumulator: string[] = [];
        for (let i = 0; i < this.stack.length; i++) {
            let res = this.stack[i].rule.toStringAsPath(i == this.stack.length - 1, this.stack[i].idx, offset);
            offset = res.offset
            accumulator.push(res.str);
        }

        let tree = accumulator.join("\n");

        return expressionLine + "\n" + tree;

    }

    stackTracke(): string {
        return this.stack.map(it => it.toString()).join("\n")
    }

    trim(): PointerStack {
        let newStart = 0;
        while (newStart < this.stack.length && this.stack[newStart].canTrim()) {
            newStart++;
        }
        return new PointerStack(this.stack.slice(newStart), this.stringPosition, this.complete);
    }
}