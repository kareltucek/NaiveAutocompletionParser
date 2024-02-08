export class Config {
    interactive: boolean; 

    constructor(interactive: boolean) {
        this.interactive = interactive;
    }

    static Interactive = new Config(true);
    static Noninteractive = new Config(false);
}