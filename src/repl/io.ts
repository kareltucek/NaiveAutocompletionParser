
let promptSync: any | undefined = undefined;
let fs: any | undefined = undefined;

function importStuff() {
    try {
        import('./node_specific').then(constructors => {
            fs = constructors.fsConstructor();
            promptSync = constructors.promptSyncConstructor();
        });
    } catch (e) {

    }
}

importStuff();

export class IO {
    static fileName: string = "/tmp/naive_ebnf_parser_state.json";
    static prompt: any | undefined;
    map: Map<string, string>;
    questionId: number;
    cmdContext: string;

    constructor() {
        this.cmdContext = "";
        this.map = new Map();
        this.questionId = 0;
        this.loadMap();
    }

    healthy(): boolean {
        return fs && promptSync;
    }

    questionHash(): string {
        return this.questionId + ":" + this.cmdContext;
    }

    setCommandContext(cmd: string) {
        this.cmdContext = cmd;
        this.questionId = 0;
    }

    saveMap() {
        if (fs) {
            const jsonMap = JSON.stringify(Array.from(this.map.entries()));
            fs.writeFileSync(IO.fileName, jsonMap);
        }
    }

    loadMap() {
        try {
            if (fs) {
                if (fs.existsSync(IO.fileName)) {
                    const loadedData = fs.readFileSync(IO.fileName, 'utf-8');
                    const loadedMap = new Map<string, string>(JSON.parse(loadedData));
                    this.map = loadedMap
                }
            } 
        } catch (e) {
            this.map = new Map();
        }
    }

    hr() {
        this.write('-'.repeat(80));
    }

    defaultAnswer(): string {
        return this.map.get(this.questionHash()) ?? "";
    }

    question(q: string, applyDefault: boolean = false): string {
        let answer = "";
        if (promptSync) {
            answer = promptSync(q) ?? "";
        } else {
            console.log("Warning: interactive shell expected, but current environment does not seem to provide it!");
        }
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