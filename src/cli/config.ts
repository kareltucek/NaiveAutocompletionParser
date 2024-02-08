export class Config {
    interactive: boolean; 

    constructor(interactive: boolean) {
        this.interactive = interactive;
    }

    static default = new Config(false);
}