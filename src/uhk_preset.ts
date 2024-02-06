import { ParserBuilder } from "./compilation/parser_builder";
import { Parser } from "./parsing/parser";
import { Cli } from "./repl/cli";
import { tokenizerRegex } from "./shared/constants";


function extractGrammar(referenceManualBody: string): string[] {
    let grammarText = referenceManualBody
        .substring(
            referenceManualBody.search("# GENERAL FUNCTIONALITY #"),
            referenceManualBody.search("# DEPRECATED #")
        )
        .split(new RegExp('[\n\r][\n\r]*'))
        .map(it => it.replace(new RegExp('^    '), ""))
        .map(it => it.replace(new RegExp('(OPERATOR.*)/'), "$1/\\//"))
        .map(it => it.replace(new RegExp('(OPERATOR.*)\\|\\|'), "$1/\\|\\|/"))
        .map(it => it.replace(new RegExp('(KEYID_ABBREV.*)[\\/]'), '$1/\\//'))
        .map(it => it.replace(new RegExp('(KEYID_ABBREV.*)[\\[]'), '$1/\\[/'))
        .map(it => it.replace(new RegExp('(KEYID_ABBREV.*)[\\]]'), '$1/\\]/'))
        .filter(it => !it.startsWith('#'))
    return grammarText;
}

function buildParser(grammarText: string): Parser {
    let parser = new ParserBuilder()
        .setTokenizerRegex(tokenizerRegex)
        .setSubWhiteRule("EXPRESSION")
        .setSubWhiteRule("MODMASK")
        .addRule(grammarText)
        .overrideRuleWithConstantString("CODE_BLOCK", "{")
        .overrideRuleWithConstantString("COMMENT", "//<comment>")
        .overrideRuleWithRegex("COMMENT", "//.*")
        .overrideRule("BOOL", "PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | 0 | 1 | true | false")
        .overrideRule("FLOAT", "PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | /[-]?[0-9]*.[0-9]+/")
        .overrideRuleWithConstantString("FLOAT", "<[-]?[0-9]*.[0-9]+>")
        .overrideRule("INT", "PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | /[-]?[0-9]+/")
        .overrideRuleWithConstantString("INT", "<[-]?[0-9]+>")
        .overrideRuleWithConstantString("STRING", "\"<interpolated string>\"")
        .overrideRuleWithConstantString("STRING", "'<literal string>'")
        .overrideRuleWithRegex("IDENTIFIER", '[a-zA-Z0-9_]*')
        .overrideRuleWithConstantString("IDENTIFIER", "<[a-zA-Z0-9_]*>")
        .build()
    return parser;
}

export function buildUhkParser(referenceManualBody: string): Parser {
    let grammarText = extractGrammar(referenceManualBody);
    let parser = buildParser(grammarText.join("\n"));
    // let parser = buildParser(simplifiedGrammar);
    return parser
}

export function retrieveUhkGrammar(): Promise<string> {
    const res = fetch('https://raw.githubusercontent.com/UltimateHackingKeyboard/firmware/master/doc-dev/reference-manual.md')
        .then(response => response.text())
    return res
}

export function startUhkCli() {
    retrieveUhkGrammar().then(testGrammar => {
        let parser = buildUhkParser(testGrammar)
        Cli.launch(parser);
    })
}

const args = process.argv.slice(2);

if (args[0] && args[0] == 'start') {
    startUhkCli();
} else if (args[0] && args[0] != '') {
    console.log("You can start the cli with `start` argument. E.g., `node file.js start`.") 
}