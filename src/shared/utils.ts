import { Pointer } from '../parsing/pointers';
import _ from 'lodash';
import { RuleRef, SequenceRule, ConstantRule, Rule } from './rules';

export function groupByAsRecord<T, K extends keyof any>(arr: T[], key: (i: T) => K) {
    return arr.reduce(
        (groups, item) => {
            (groups[key(item)] ||= []).push(item);
            return groups;
        },
        {} as Record<K, T[]>
    );
}

export function groupBy<T, K extends keyof any>(arr: T[], key: (i: T) => K): Map<string, T[]> {
    let record: Record<K, T[]> = groupByAsRecord(arr, key);
    return new Map(Object.entries(record));
}

export function deduplicate<T>(array: T[]): T[] {
    return _.uniqWith(array, _.isEqual);
}

export function markPointersAsConsumed(pointers: Pointer[]): Pointer[] {
    return pointers.map(it => new Pointer(it.rule, it.idx, true))
}

export function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function rulesEqual(a: Rule, b: Rule) {
    if (a instanceof RuleRef && b instanceof RuleRef) {
        return a.ref == b.ref;
    }
    if (a instanceof ConstantRule && b instanceof ConstantRule) {
        return a.token == b.token;
    }
    if (a instanceof SequenceRule && b instanceof SequenceRule) {
        if (a.rules.length != b.rules.length || a.name != b.name) {
            return false;
        }
        for (let i = 0; i < a.rules.length; i++) {
            if (!rulesEqual(a.rules[i], b.rules[i])) {
                return false;
            }
        }
        return true;
    }
    return false;
}