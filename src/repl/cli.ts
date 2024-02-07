import { IO } from "./io";
import { Parser } from "../parsing/parser";
import { ParserBuilder } from "../compilation/parser_builder";
import { BnfTransform } from "../transforms/bnf_transform";
import { BinaryFormTransformation } from "../transforms/binary_form_transform";
import { NullableRuleElimination } from "../transforms/nullable_elimination_transform";
import { UnitRuleElimination } from "../transforms/unit_rule_elimination";
import { GnfTransform } from "../transforms/gnf_transform";
import { LeftRecursionElimination } from "../transforms/left_recursion_elimination";
import { NoOpRuleElimination } from "../transforms/no_op_rule_elimination";

export class Cli {
    static launch(parserBuilder: ParserBuilder) {
        let io: IO = new IO();
        let parser = parserBuilder.build(io);

        if (!io.healthy()) {
            console.log("File system features not found. They are not present in releases. Build locally to access the shell.");
            return;
        }

        while (true) {
            let cmd = io.ask('> ');
            if (cmd.startsWith("help")) {
                console.log("Available commands:")
                console.log("  <string to complete>")
                console.log("  help")
                console.log("  rules [<pattern to search>]")
                console.log("  eval <rule name> <string to match to>")
                console.log("  walk <rule name> <string to match to>")
                console.log("  transform { bnf | gnf | nre }")
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
                io.setCommandContext(nonterminal + ":" + expression);
                let suggestions = parser.complete(expression, nonterminal, io);
                io.hr();
                suggestions.forEach(suggestion => console.log("  " + expression + suggestion.suggestion.substring(suggestion.overlap)));
            } else if (cmd.startsWith("transform bnf")) {
                parser.setGrammar(parser.grammar.bind(BnfTransform.transform));
            } else if (cmd.startsWith("transform nre")) {
                parser.setGrammar(parser.grammar.bind(NullableRuleElimination.transform));
            } else if (cmd.startsWith("transform gnf")) {
                parser.setGrammar(parser.grammar.bind(GnfTransform.transform));
            } else {
                parser.complete(cmd, "BODY").forEach(suggestion => {
                    console.log("  " + cmd + suggestion.suggestion.substring(suggestion.overlap));
                })
            }
        }
    }
}