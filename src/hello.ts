import { ParserBuilder } from "./parser_builder";
import { tokenizerRegex, testGrammar } from "./constants";

console.log("hello!")

let res = new ParserBuilder()
    .setTokenizerRegex(tokenizerRegex)
    .addGrammarRule(testGrammar)
    .build()

let dbg = 666
