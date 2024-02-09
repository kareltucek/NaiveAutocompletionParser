import { PointerStack, Pointer } from "../parsing/pointers";
import { MatchResult } from "../parsing/match_results";
import { Grammar} from "./grammar";
import { IterationType } from "./rules/iteration_type";
import { escapeRegex, markPointersAsConsumed } from "./utils";
import { strictIdentifierRegex, maxRecursionDepth } from "./constants";
import { IO } from "../cli/io";
import { RuleMath } from "./rule_math";
import * as constants from "../shared/constants"
import { GrammarLookupResult } from "./grammar_lookup_result";




