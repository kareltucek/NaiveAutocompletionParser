import { ParserBuilder } from "./parser_builder";
import { tokenizerRegex} from "./data_types/constants";
import { Parser } from "./parser";


function buildUhkParser(referenceManualBody: string): Parser {
    let grammarText = referenceManualBody
        .substring(
            referenceManualBody.search("# GENERAL FUNCTIONALITY #"),
            referenceManualBody.search("# DEPRECATED #")
        )
        .split(new RegExp('[\n\r][\n\r]*'))
        .map (it => it.replace(new RegExp('^    '), ""))
        .filter(it => !it.startsWith('#'))

    let dbg = 666

    let parser = new ParserBuilder()
        .setTokenizerRegex(tokenizerRegex)
        .addRule(grammarText.join("\n"))
        .build()

    return parser
}

function retrieveGrammar(): Promise<string> {
    const res = fetch('https://raw.githubusercontent.com/UltimateHackingKeyboard/firmware/master/doc-dev/reference-manual.md')
        .then(response => response.text())
    return res
}

retrieveGrammar().then( testGrammar => {
    let parser = buildUhkParser(testGrammar)

    let suggestions = parser.complete("ifCtrl ifShift set key", "BODY");

    let dbg = 666
})



