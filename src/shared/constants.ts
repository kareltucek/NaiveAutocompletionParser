import { ParserBuilder } from "../compilation/parser_builder";


let regexPattern: string = '/([^/\\\\]|\\\\.|\\\\\\\\)+/';
let nonterminalPattern: string = '[A-Z_][A-Z0-9_]*';
let identifierPattern: string = '[a-zA-Z_][a-zA-Z0-9_]*';
let humanPattern: string = '<([^<>|]*)\\((' + nonterminalPattern + ')\\)>';
let simpleHumanPattern: string = '<[^<>|]+>';
let constantRegexPattern: string = '^([^\\\\]|\\\\.|\\\\\\\\)+$';

// anything can be suggested right after these chars
let continueAfterPattern: string = '[\\.\\$\\(\\ \\-]';

// these characters can be suggested after any chars
let continueWithPattern: string = '[\\. ]';

let tokenPattern = [
    '[a-zA-Z0-9_]+',
    humanPattern,
    regexPattern,
    '//',
    '[\\]][+?*]',
    '[}][+?*]',
    '<=',
    '>=',
    '==',
    '!=',
    '&&',
    '[|][|]',
    simpleHumanPattern,
    '[^ ]',
].join('|')

let grammarTokenPattern = '^ *(' + tokenPattern + ')'

function strict(pattern: string): string {
    return "^" + pattern + "$";
}


export let stackTrimming = true;
export let maxRecursionDepth = 1;
export let strictRegexRegex: RegExp = new RegExp(strict(regexPattern));
export let strictHumanRegex: RegExp = new RegExp(strict(humanPattern));
export let strictSimpleHumanRegex: RegExp = new RegExp(strict(simpleHumanPattern));
export let strictNonterminalRegex: RegExp = new RegExp(strict(nonterminalPattern));
export let strictIdentifierRegex: RegExp = new RegExp(strict(identifierPattern));
export let identifierRegex: RegExp = new RegExp(identifierPattern);
export let continueAfterRegex: RegExp = new RegExp(continueAfterPattern)
export let continueWithRegex: RegExp = new RegExp(continueWithPattern)
export let nonterminalRegex: RegExp = new RegExp(nonterminalPattern);
export let grammarTokenRegex: RegExp = new RegExp(grammarTokenPattern);
export let constantRegexRegex: RegExp = new RegExp(constantRegexPattern);
export let applyTransformsWithoutAsking: boolean = true;