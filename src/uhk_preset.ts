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

function buildParserBuilder(grammarText: string): ParserBuilder {
    let parserBuilder = new ParserBuilder()
        .setTokenizerRegex(tokenizerRegex)
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
    return parserBuilder;
}

function testingParserBuilder(): ParserBuilder {
    let simplifiedGrammar = `
    BODY = COMMENT
    BODY = [LABEL:] COMMAND [COMMENT]
    COMMENT = //<comment>
    COMMAND = [CONDITION|MODIFIER]* COMMAND
    CONDITION = {ifShortcut | ifNotShortcut} [IFSHORTCUT_OPTIONS]* [KEYID]+
    CONDITION = {ifGesture | ifNotGesture} [IFSHORTCUT_OPTIONS]* [KEYID]+
    IFSHORTCUT_OPTIONS = noConsume | transitive | anyOrder | orGate | timeoutIn <time in ms (INT)> | cancelIn <time in ms(INT)>
    OPERATOR = + | - | * | / | % | < | > | <= | >= | == | != | && | ||
    VARIABLE_EXPANSION = $<variable name> | $<config value name> | $currentAddress | $thisKeyId | $queuedKeyId.<queue index (INT)> | $keyId.KEYID_ABBREV
    EXPRESSION = (EXPRESSION) | INT | BOOL | FLOAT | VARIABLE_EXPANSION | EXPRESSION OPERATOR EXPRESSION | !EXPRESSION | min(EXPRESSION [, EXPRESSION]+) | max(EXPRESSION [, EXPRESSION]+)
    PARENTHESSED_EXPRESSION = (EXPRESSION)
    INT = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | [0-9]+ | -[0-9]+
    BOOL = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | 0 | 1
    FLOAT = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | [0-9]*.[0-9]+ | -FLOAT
    VALUE = INT | BOOL | FLOAT
    IDENTIFIER = [a-zA-Z_][a-zA-Z0-9_]*
    CHAR = <any nonwhite ascii char>
    LABEL = <label (IDENTIFIER)>
    ACTION = { macro MACROID | keystroke SHORTCUT | none }
    SCANCODE = <en-US character(CHAR)> | <scancode abbreviation(SCANCODE_ABBREV)>
    KEYID = <numeric keyid (INT)> | <keyid abbreviation(KEYID_ABBREV)>
    KEYID_ABBREV = a | q | w | e | r | t | y | u | i | o | p | a | s | d | f | g | h | j | k | l | z | x | c | v | b | n | m
    `;
    // let simplifiedGrammar = `
    // BODY = AA [BB]* [CC]+
    // AA = a
    // BB = b
    // CC = c
    // `;
    let builder = new ParserBuilder()
        .setTokenizerRegex(tokenizerRegex)
        .addRule(simplifiedGrammar);
    return builder;
}

function buildUhkParserBuilder(referenceManualBody: string): ParserBuilder {
    let grammarText = extractGrammar(referenceManualBody);
    let builder = buildParserBuilder(grammarText.join("\n"));
    // let builder = testingParserBuilder();
    return builder;
}

export function buildUhkParser(referenceManualBody: string): Parser {
    return buildUhkParserBuilder(referenceManualBody).build();
}

export function retrieveUhkGrammar(): Promise<string> {
    const res = fetch('https://raw.githubusercontent.com/UltimateHackingKeyboard/firmware/master/doc-dev/reference-manual.md')
        .then(response => response.text())
    return res
}

export function startUhkCli() {
    retrieveUhkGrammar().then(testGrammar => {
        let builder = buildUhkParserBuilder(testGrammar)
        Cli.launch(builder);
    })
}
