import { Pointer } from '../parsing/pointers.js';
import _ from 'lodash';
import { Suggestion } from '../parsing/suggestion.js';
import { Rule } from './rules/rule_interface.js';
import { RuleRef } from './rules/rule_ref.js';
import { ConstantRule } from './rules/constant_rule.js';
import { SequenceRule } from './rules/sequence_rule.js';
import * as constants from './constants.js';

export function groupByAsRecord<T, K extends keyof any>(arr: T[], key: (i: T) => K) {
    return arr.reduce(
        (groups, item) => {
            (groups[key(item)] ||= []).push(item);
            return groups;
        },
        {} as Record<K, T[]>
    );
}

export function groupByAsMap<T, K extends keyof any>(arr: T[], key: (i: T) => K): Map<string, T[]> {
    let record: Record<K, T[]> = groupByAsRecord(arr, key);
    return new Map(Object.entries(record));
}

const suggestionComparator: _.Comparator<Suggestion> = (a, b) => {
    return a.suggestion == b.suggestion && a.overlap == b.overlap && a.originRule == a.originRule;
};

export function deduplicateSuggestions(array: Suggestion[]): Suggestion[] {
    return _.uniqWith(array, suggestionComparator);
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

export function mapOf<T, H>(elems: T[], hash: (e: T) => H): Map<H, T> {
    const map = new Map<H, T>();
    elems.forEach(e => {
        map.set(hash(e), e);
    });
    return map;
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

 export function tryConvertRegexToConstant(regex: RegExp): string | undefined {
    let source = regex.source;
    if (constants.constantRegexRegex.test(source)) {
        let unescapedSource = source.replace(new RegExp('\\\\(.)', 'g'), "$1");
        if (escapeRegex(unescapedSource) == source) {
            return unescapedSource;
        }
    }
    return undefined;
}