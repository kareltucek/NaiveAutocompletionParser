
import { ParserBuilder } from "./parser_builder";
import { tokenizerRegex, testGrammar } from "./constants";

console.log("hello!")

let parser = new ParserBuilder()
    .setTokenizerRegex(tokenizerRegex)
    .addGrammarRule(testGrammar)
    .build()

let suggestions = parser.complete("ifCtrl ifShift set key", "BODY");

let dbg = 666
