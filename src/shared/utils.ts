import { Pointer } from '../parsing/pointers';
import _ from 'lodash';

export const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce((groups, item) => {
    (groups[key(item)] ||= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);

export function deduplicate<T>(array: T[]): T[] {
  return _.uniqWith(array, _.isEqual);
}

export function markPointersAsConsumed(pointers: Pointer[]): Pointer[] {
    return pointers.map(it => new Pointer(it.rule, it.idx, true))
}

export function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
