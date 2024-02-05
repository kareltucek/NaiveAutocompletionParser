import * as fs from 'fs';
import promptSync from 'prompt-sync';

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