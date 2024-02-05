import { IO } from "./io";
import { Parser } from "../parsing/parser";

export class Cli {
    static launch(parser: Parser) {
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
                io.setCommandContext(nonterminal + ":" + expression);
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
}