import { IO } from "./io";
import { Parser } from "../parsing/parser";
import { ParserBuilder } from "../compilation/parser_builder";
import { BnfTransform } from "../transforms/bnf_transform";
import { NullableRuleElimination } from "../transforms/nullable_elimination_transform";
import { GnfTransform } from "../transforms/gnf_transform";
import { Config } from "./config";
import { IOProvider } from "./io_provider";

export class Cli {
    static launch(parserBuilder: ParserBuilder, io: IO) {
        let parser = parserBuilder.build();

        if (!io.healthy()) {
            io.write("File system features not found. They are not present in releases. Build locally to access the shell.");
            return;
        }

        while (true) {
            let cmd = io.ask('> ');
            if (cmd.startsWith("help")) {
                io.write("Available commands:")
                io.write("  <string to complete>")
                io.write("  help")
                io.write("  rules [<pattern to search>]")
                io.write("  eval <rule name> <string to match to>")
                io.write("  walk <rule name> <string to match to>")
                io.write("  transform { bnf | gnf | nre }")
                io.write("  exit")
            } else if (cmd.startsWith("rules")) {
                let pattern = cmd.replace(new RegExp('rules *'), "");
                parser.grammar.rules.forEach(rules =>
                    rules
                        .filter(rule => pattern == '' || rule.toString().search(pattern) >= 0)
                        .forEach(rule => io.write(rule.toString()))
                )
            } else if (cmd.startsWith("exit")) {
                return;
            } else if (cmd.startsWith("eval")) {
                let m = cmd.match(new RegExp('([^ ]+) +([^ ]+) (.*)'));
                let command = m![1];
                let nonterminal = m![2];
                let expression = m![3];
                parser.complete(expression, nonterminal).forEach(suggestion => io.write("  " + expression + suggestion.suggestion.substring(suggestion.overlap)))
            } else if (cmd.startsWith("walk")) {
                let m = cmd.match(new RegExp('([^ ]+) +([^ ]+) (.*)'));
                let command = m![1];
                let nonterminal = m![2];
                let expression = m![3];
                io.answerCache.setCommandContext(nonterminal + ":" + expression);
                let suggestions = parser.complete(expression, nonterminal);
                io.hr();
                suggestions.forEach(suggestion => io.write("  " + expression + suggestion.suggestion.substring(suggestion.overlap)));
            } else if (cmd.startsWith("transform bnf")) {
                parser.setGrammar(parser.grammar.bind(BnfTransform.transform, io));
            } else if (cmd.startsWith("transform nre")) {
                parser.setGrammar(parser.grammar.bind(NullableRuleElimination.transform, io));
            } else if (cmd.startsWith("transform gnf")) {
                parser.setGrammar(parser.grammar.bind(GnfTransform.transform, io));
            } else {
                parser.complete(cmd, "BODY").forEach(suggestion => {
                    io.write("  " + cmd + suggestion.suggestion.substring(suggestion.overlap));
                })
            }
        }
    }
}