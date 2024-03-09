import { SequenceRule } from "./rules/sequence_rule.js";

export class AddedRules<T> {
    item: T;
    newRules: SequenceRule[];

    constructor(item: T, newRules: SequenceRule[] = []) {
        this.item = item;
        this.newRules = newRules;
    }

    static of<T>(item: T, newRules: SequenceRule[] = []) {
        return new AddedRules(item, newRules);
    }

    static ofArray<T>(items: AddedRules<T>[]): AddedRules<T[]> {
        return new AddedRules(
            items.map(it => it.item),
            items.flatMap(it => it.newRules)
        )
    }

    map<R>(transform: (item: T) => R): AddedRules<R> {
        return new AddedRules(transform(this.item), this.newRules);
    }

    flatMap<R>(transform: (item: T) => AddedRules<R>) {
        let transformResult = transform(this.item);
        return new AddedRules(
            transformResult.item,
            [ ...transformResult.newRules, ...this.newRules ]
        )
    }

    flat(): SequenceRule[] {
        if (this.item instanceof SequenceRule) {
            return [...this.newRules, this.item as SequenceRule] ;
        } else if (Array.isArray(this.item)) {
            return [...this.newRules, ...(this.item as SequenceRule[])];
        } else {
            throw "AddedRules.flat called on incompatible object:" + this.item;
        }
    }
}