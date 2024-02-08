import { Config } from './config';
import { IOProvider } from './io_provider';
import { AnswerCache } from './answer_cache';

export class IO {
    static dummy = new IO(Config.default, IOProvider.dummy);

    private ioProvider: IOProvider;

    config: Config;
    answerCache: AnswerCache;

    constructor(
        config: Config,
        ioProvider: IOProvider
    ) {
        this.answerCache = new AnswerCache(ioProvider);
        this.answerCache.load();
        this.config = config;
        this.ioProvider = ioProvider;
    }

    healthy(): boolean {
        return this.ioProvider.healthy;
    }



    hr() {
        this.write('-'.repeat(80));
    }

    ask(q: string, applyDefault: boolean = false): string {
        let answer = "";
        if (applyDefault) {
            console.log("Default: " + this.answerCache.defaultAnswer());
        }
        answer = this.ioProvider.ask(q) ?? "";
        if (applyDefault) {
            answer = this.answerCache.applyDefault(answer);
        }
        return answer;
    }

    write(str: string) {
        console.log(str);
    }

    warn(str: string) {
        console.warn(str);
    }

    debug(str: string) {
        console.debug(str);
    }
}