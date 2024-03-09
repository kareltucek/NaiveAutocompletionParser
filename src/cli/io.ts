import { IOConfig } from './io_config.js';
import { IOProvider } from './io_provider.js';
import { AnswerCache } from './answer_cache.js';

export class IO {
    static dummy = new IO(IOConfig.default, IOProvider.dummy);

    private ioProvider: IOProvider;

    config: IOConfig;
    answerCache: AnswerCache;

    constructor(
        config: IOConfig,
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