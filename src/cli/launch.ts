import { startUhkCli } from "../presets/uhk_preset";
import { IOProvider } from "./io_provider";
import promptSync from 'prompt-sync';
import fs from 'fs';

function ioProvider(): IOProvider {
    let prompt = promptSync();
    let provider = new IOProvider();

    provider.healthy = true;
    provider.ask = (q) => prompt(q);
    provider.saveFile = (fn, content) => fs.writeFileSync(fn, content); 
    provider.loadFile = (fn) => {
        try {
            if (fs) {
                if (fs.existsSync(fn)) {
                    return fs.readFileSync(fn, 'utf-8');
                }
            } 
        } catch (e) { }
        return undefined;
    };
    return provider;
}

startUhkCli(ioProvider());