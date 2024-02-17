export class IOConfig {
    interactive: boolean; 

    constructor(interactive: boolean) {
        this.interactive = interactive;
    }

    static default = new IOConfig(false);
}