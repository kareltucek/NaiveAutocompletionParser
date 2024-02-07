import { Rule } from "./rules";

export class RuleMath {
    static multiply(bases: Rule[][], continuations: Rule[][]): Rule[][] {
        return continuations.flatMap (continuation => 
            bases.map ( base =>
                    [...base, ...continuation]
                )
            )
    }

    static produce(arrayOfPosibleSubsequences: Rule[][][]): Rule[][] {
        return arrayOfPosibleSubsequences.reduce(
            (bases, continuations) => this.multiply(bases, continuations),
            [[]]
        )
    }
}