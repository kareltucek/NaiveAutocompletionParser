export class IOProvider {
    healthy: boolean = false;
    ask: (q: string) => string | undefined = q => "";
    saveFile: (filename: string, content: string) => void = () => {};
    loadFile: (filename: string) => string | undefined = fn => undefined;

    static dummy = new IOProvider;
}