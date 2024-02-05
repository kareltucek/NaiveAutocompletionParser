import { Rule, SequenceRule } from "../shared/rules";

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
        let expressionLine = expression + "\n" +
            " ".repeat(this.stringPosition) + "^" + "\n";

        let offset = 0;
        let accumulator = [];
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

    isSubWhitePath(): boolean {
        for (let i = 0; i < this.stack.length; i++) {
            let checkedRule = this.stack[i].rule;
            if (checkedRule instanceof SequenceRule && (checkedRule as SequenceRule).isSubWhite) {
                return true;
            }
        }
        return false;
    }

    containsRuleIn(rules: Set<string>) {
        for (let i = 0; i < this.stack.length; i++) {
            let checkedRule = this.stack[i].rule;
            if (checkedRule instanceof SequenceRule && rules.has((checkedRule as SequenceRule).name)) {
                return true;
            }
        }
        return false;
    }
}