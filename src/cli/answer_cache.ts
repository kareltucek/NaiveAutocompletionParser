import { Config } from './config';
import { IOProvider } from './io_provider';

export class AnswerCache {
    static fileName: string = "/tmp/naive_ebnf_parser_state.json";

    private ioProvider: IOProvider;
    private map: Map<string, string>;
    private questionId: number;
    private cmdContext: string;

    constructor(
        ioProvider: IOProvider
    ) {
        this.cmdContext = "";
        this.map = new Map();
        this.questionId = 0;
        this.ioProvider = ioProvider;
        this.load();
    }

    save() {
            const jsonMap = JSON.stringify(Array.from(this.map.entries()));
            this.ioProvider.saveFile(AnswerCache.fileName, jsonMap);
        }

    load() {
        const loadedData = this.ioProvider.loadFile(AnswerCache.fileName);
        if (loadedData) {
            const loadedMap = new Map<string, string>(JSON.parse(loadedData));
            this.map = loadedMap
        } else {
            this.map = new Map();
        }
    }

    questionHash(): string {
        return this.questionId + ":" + this.cmdContext;
    }

    defaultAnswer(): string {
        return this.map.get(this.questionHash()) ?? "";
    }

    applyDefault(answer: string): string {
        if (answer == "") {
            answer = this.map.get(this.questionHash()) ?? ""
            this.questionId++;
        } else {
            this.map.set(this.questionHash(), answer);
            this.questionId++;
            this.save();
        }
        return answer;
    }

    setCommandContext(cmd: string) {
        this.cmdContext = cmd;
        this.questionId = 0;
    }
}