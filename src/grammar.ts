import { Rule } from "./rule_types";

export class Grammar {
    rules: Map<string, Rule[]> = new Map<string, Rule[]>();
}
