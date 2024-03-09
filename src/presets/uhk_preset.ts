import { ParserBuilder } from "../compilation/parser_builder.js";
import { Parser } from "../parsing/parser.js";
import { Interpretter } from "../cli/interpretter.js";
import { grammarTokenRegex } from "../shared/constants.js";
import { IOConfig } from "../cli/io_config.js";
import { IOProvider } from "../cli/io_provider.js";
import { IO } from "../cli/io.js";


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

function composeConfigValueNameRules(grammarText: string): string {
    let setRuleRegex = new RegExp('^ *COMMAND *= *set +([^ ]+) +');
    let valueRules = grammarText
        .split(new RegExp('[\n\r]+'))
        .map ( it => it.match(setRuleRegex))
        .filter( it => it && it[1] && it[1] != '')
        .map ( it => "CONFIG_VALUE_NAME = " + it!![1]);
    let valueRule = "VARIABLE_EXPANSION = $CONFIG_VALUE_NAME";
    return [...valueRules, valueRule].join("\n")

}

function buildParserBuilder(grammarText: string, io: IO): ParserBuilder {
    let parserBuilder = new ParserBuilder(io)
        .setGrammarTokenPattern(grammarTokenRegex)
        .addRule(grammarText)
        .addRule(composeConfigValueNameRules(grammarText))
        .addRule("CHAR = /./")
        // .addRule(simplifiedGrammar)
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
        .overrideRuleWithRegex("IDENTIFIER", '[a-zA-Z][a-zA-Z0-9_]*')
        .overrideRuleWithConstantString("IDENTIFIER", "<[a-zA-Z][a-zA-Z0-9_]*>")
        .overrideRuleWithRegex("MODMASK", "\\b([LR]?[CSAG]|[ios]|[trhp])+")
        .overrideRuleWithConstantString("MODMASK", "LS")
        .overrideRuleWithConstantString("MODMASK", "RS")
        .overrideRuleWithConstantString("MODMASK", "LA")
        .overrideRuleWithConstantString("MODMASK", "RA")
        .overrideRuleWithConstantString("MODMASK", "LG")
        .overrideRuleWithConstantString("MODMASK", "RG")
        .overrideRuleWithConstantString("MODMASK", "LC")
        .overrideRuleWithConstantString("MODMASK", "RC")
        .overrideRuleWithConstantString("MODMASK", "i")
        .overrideRuleWithConstantString("MODMASK", "o")
        .overrideRuleWithConstantString("MODMASK", "s")
        .overrideRuleWithConstantString("MODMASK", "p")
        .overrideRuleWithConstantString("MODMASK", "t")
        .overrideRuleWithConstantString("MODMASK", "r")
        .overrideRuleWithConstantString("MODMASK", "h")
    return parserBuilder;
}

function testingParserBuilder(io: IO): ParserBuilder {

    let simplifiedGrammar = `
    A = a B
    A = a C
    B = b
    C = c
    `;

    // let simplifiedGrammar = `
    // BODY = COMMENT
    // BODY = [LABEL:] COMMAND [COMMENT]
    // COMMENT = //<comment>
    // COMMAND = [CONDITION|MODIFIER]* COMMAND
    // CONDITION = {ifShortcut | ifNotShortcut} [IFSHORTCUT_OPTIONS]* [KEYID]+
    // CONDITION = {ifGesture | ifNotGesture} [IFSHORTCUT_OPTIONS]* [KEYID]+
    // IFSHORTCUT_OPTIONS = noConsume | transitive | anyOrder | orGate | timeoutIn <time in ms (INT)> | cancelIn <time in ms(INT)>
    // OPERATOR = + | - | * | / | % | < | > | <= | >= | == | != | && | ||
    // VARIABLE_EXPANSION = $<variable name> | $<config value name> | $currentAddress | $thisKeyId | $queuedKeyId.<queue index (INT)> | $keyId.KEYID_ABBREV
    // EXPRESSION = (EXPRESSION) | INT | BOOL | FLOAT | VARIABLE_EXPANSION | EXPRESSION OPERATOR EXPRESSION | !EXPRESSION | min(EXPRESSION [, EXPRESSION]+) | max(EXPRESSION [, EXPRESSION]+)
    // PARENTHESSED_EXPRESSION = (EXPRESSION)
    // INT = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | [0-9]+ | -[0-9]+
    // BOOL = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | 0 | 1
    // FLOAT = PARENTHESSED_EXPRESSION | VARIABLE_EXPANSION | [0-9]*.[0-9]+ | -FLOAT
    // VALUE = INT | BOOL | FLOAT
    // IDENTIFIER = [a-zA-Z_][a-zA-Z0-9_]*
    // CHAR = <any nonwhite ascii char>
    // LABEL = <label (IDENTIFIER)>
    // ACTION = { macro MACROID | keystroke SHORTCUT | none }
    // SCANCODE = <en-US character(CHAR)> | <scancode abbreviation(SCANCODE_ABBREV)>
    // KEYID = <numeric keyid (INT)> | <keyid abbreviation(KEYID_ABBREV)>
    // KEYID_ABBREV = a | q | w | e | r | t | y | u | i | o | p | a | s | d | f | g | h | j | k | l | z | x | c | v | b | n | m
    // `;

    // let simplifiedGrammar = `
    // BODY = a <first label(BB)> <second label(CC)>
    // BB = b
    // CC = c
    // `;

    let builder = new ParserBuilder(io)
        .addRule(simplifiedGrammar);
    return builder;
}

function buildUhkParserBuilder(referenceManualBody: string, io: IO): ParserBuilder {
    let grammarText = extractGrammar(referenceManualBody);
    let builder = buildParserBuilder(grammarText.join("\n"), io);
    // let builder = testingParserBuilder(io);
    return builder;
}

export function buildUhkParser(referenceManualBody: string, io = IO.dummy): Parser {
    return buildUhkParserBuilder(referenceManualBody, io).build();
}

export function retrieveUhkGrammar(): Promise<string> {
    const res = fetch('https://raw.githubusercontent.com/UltimateHackingKeyboard/firmware/master/doc-dev/reference-manual.md')
        .then(response => response.text())
    return res
}

export function startUhkCli(ioProvider: IOProvider) {
    retrieveUhkGrammar().then(testGrammar => {
        let io = new IO(IOConfig.default, ioProvider);
        let builder = buildUhkParserBuilder(testGrammar, io);
        Interpretter.launch(builder, io);
    })
}
