import { ParserBuilder } from "./parser_builder";
import { tokenizerRegex } from "./constants";
import { Parser } from "./parser";
import * as fs from 'fs';
import promptSync from 'prompt-sync';


let simplifiedGrammar = `
    VARIABLE_EXPANSION = $<variable name> | $<config value name> | $currentAddress | $thisKeyId | $queuedKeyId.<queue index (INT)> | $keyId.KEYID_ABBREV
    `

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

function buildUhkParser(referenceManualBody: string): Parser {
    let grammarText = extractGrammar(referenceManualBody);
    let parser = buildParser(grammarText.join("\n"));
    // let parser = buildParser(simplifiedGrammar);
    return parser
}

function retrieveGrammar(): Promise<string> {
    const res = fetch('https://raw.githubusercontent.com/UltimateHackingKeyboard/firmware/master/doc-dev/reference-manual.md')
        .then(response => response.text())
    return res
}

export class IO {
    static fileName = "/tmp/naive_ebnf_parser_state.json";
    static prompt = promptSync();
    map: Map<string, string>;
    questionId: number;
    cmdContext: string;

    questionHash(): string {
        return this.questionId + ":" + this.cmdContext;
    }

    setCommandContext(cmd: string) {
        this.cmdContext = cmd;
        this.questionId = 0;
    }

    saveMap() {
        const jsonMap = JSON.stringify(Array.from(this.map.entries()));
        fs.writeFileSync(IO.fileName, jsonMap);
    }

    loadMap() {
        try {
            if (fs.existsSync(IO.fileName)) {
                const loadedData = fs.readFileSync(IO.fileName, 'utf-8');
                const loadedMap = new Map<string, string>(JSON.parse(loadedData));
                this.map = loadedMap
            }
        } catch (e) {
            this.map = new Map();
        }
    }

    constructor() {
        this.cmdContext = "";
        this.map = new Map();
        this.questionId = 0;
        this.loadMap();
    }

    hr() {
        this.write('-'.repeat(80));
    }

    defaultAnswer(): string {
        return this.map.get(this.questionHash()) ?? "";
    }

    question(q: string, applyDefault: boolean = false): string {
        let answer = IO.prompt( q ) ?? "";
        if (applyDefault) {
            if (answer == "") {
                answer = this.map.get(this.questionHash()) ?? ""
                this.questionId++;
            } else {
                this.map.set(this.questionHash(), answer);
                this.questionId++;
                this.saveMap();
            }
        }
        return answer;
    }

    write(str: string) {
        console.log(str);
    }
}

function launchCli(parser: Parser) {
    let io: IO = new IO();

    while (true) {
        let cmd = io.question('> ');
        if (cmd.startsWith("help")) {
            console.log("Available commands:")
            console.log("  <string to complete>")
            console.log("  help")
            console.log("  rules [<pattern to search>]")
            console.log("  eval <rule name> <string to match to>")
            console.log("  walk <rule name> <string to match to>")
            console.log("  exit")
        } else if (cmd.startsWith("rules")) {
            let pattern = cmd.replace(new RegExp('rules *'), "");
            parser.grammar.rules.forEach(rules =>
                rules
                    .filter(rule => pattern == '' || rule.toString().search(pattern) >= 0)
                    .forEach(rule => console.log(rule.toString()))
            )
        } else if (cmd.startsWith("exit")) {
            return;
        } else if (cmd.startsWith("eval")) {
            let m = cmd.match(new RegExp('([^ ]+) +([^ ]+) (.*)'));
            let command = m![1];
            let nonterminal = m![2]; 
            let expression = m![3]; 
            parser.complete(expression, nonterminal).forEach(suggestion => console.log("  " + expression + suggestion.suggestion.substring(suggestion.overlap)))
        } else if (cmd.startsWith("walk")) {
            let m = cmd.match(new RegExp('([^ ]+) +([^ ]+) (.*)'));
            let command = m![1];
            let nonterminal = m![2]; 
            let expression = m![3]; 
            io.setCommandContext(nonterminal+":"+expression);
            let suggestions = parser.complete(expression, nonterminal, io);
            io.hr();
            suggestions.forEach(suggestion => console.log("  " + expression + suggestion.suggestion.substring(suggestion.overlap)));
        } else {
            parser.complete(cmd, "BODY").forEach(suggestion => {
                console.log("  " + cmd + suggestion.suggestion.substring(suggestion.overlap));
            })
        }
    }
}

retrieveGrammar().then(testGrammar => {
    let parser = buildUhkParser(testGrammar)
    launchCli(parser);
})
