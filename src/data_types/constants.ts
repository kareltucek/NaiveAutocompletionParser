import { ParserBuilder } from "../parser_builder";

let regexPattern: string = '/([^/]|\\/|\\\\)+/';
let nonterminalPattern: string = '[A-Z0-9_]+';
let identifierPattern: string = '[a-zA-Z0-9_]+';
let humanPattern: string = '<([^<>]*)\\((' + nonterminalPattern + ')\\)>';
let simpleHumanPattern: string = '<[^<>]+>'

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

let tokenizerPattern = '^ *(' + tokenPattern + ')'

function strict(pattern: string): string {
    return "^" + pattern + "$";
}

export let strictRegexRegex: RegExp = new RegExp(strict(regexPattern));
export let strictHumanRegex: RegExp = new RegExp(strict(humanPattern));
export let strictNonterminalRegex: RegExp = new RegExp(strict(nonterminalPattern));
export let strictIdentifierRegex: RegExp = new RegExp(strict(identifierPattern));
export let nonterminalRegex: RegExp = new RegExp(nonterminalPattern);
export let tokenizerRegex: RegExp = new RegExp(tokenizerPattern);
