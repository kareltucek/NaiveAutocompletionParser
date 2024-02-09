import { SequenceRule } from "./rules";

export class GrammarLookupResult {
    matchingRules: SequenceRule[] = [];
    maybeMatchingRules: SequenceRule[] = [];

    static of(matchingRules: SequenceRule[], maybeMatchingRules: SequenceRule[]) {
        let self = new GrammarLookupResult();
        self.matchingRules = matchingRules;
        self.maybeMatchingRules = maybeMatchingRules;
        return self;
    }

}
