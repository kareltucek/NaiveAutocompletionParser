
export interface Rule {
};

export interface ReferencableRule {
    name: string;
};


export class RegexRule implements Rule {
    regex: RegExp;

    constructor(r: RegExp) {
        this.regex = r;
    }

    toString(): string {
        return "/" + this.regex.toString() + "/"
    }
}

export class ConstantRule implements Rule {
    token: string = "";

    constructor(t: string) {
        this.token = t;
    }

    toString(): string {
        return '"' + this.token + '"'
    }
}

export class RuleRef implements Rule {
    ref: string;
    tooltip: string;

    constructor(n: string, t: string = "") {
        this.ref = n;
        this.tooltip = t;
    }

    toString(): string {
        return "&" + this.ref
    }
}

export class SequenceRule implements Rule, ReferencableRule {
    name: string = "";
    rules: Rule[] = new Array();

    static fromRegex(n: string, r: RegExp): SequenceRule {
        let newRule = new SequenceRule();
        newRule.name = n;
        newRule.rules.push(new RegexRule(r))
        return newRule;
    }

    toString(): string {
        let sequence = this.rules
            .map(it => it.toString())
            .join(" .. ")
        return this.name + ": " + sequence
    }
}

export class IterationRule implements Rule {
    iterationType: IterationType = IterationType.ZeroOrMore;
    rule: RuleRef = new RuleRef("");

    constructor(n: string, type: IterationType) {
        this.iterationType = type;
        this.rule = new RuleRef(n)
    }

    toString(): string {
        return this.rule.toString() + "*"
    }
}

export enum IterationType {
    OneOrMore,
    ZeroOrOne,
    ZeroOrMore,
    One,
}
