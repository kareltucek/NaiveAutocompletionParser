import { startUhkCli } from "../uhk_preset";

export function fsConstructor(): any {
    return require('fs');
}

export function promptSyncConstructor(): any {
    const prompt = require('prompt-sync');
    return prompt();
}

function handleCli() {
    if (
        typeof process !== undefined &&
        process.versions != null &&
        process.versions.node != null
    ) {
        const args = process.argv.slice(2);

        if (args[0] && args[0] == 'start') {
            startUhkCli();
        } else if (args[0] && args[0] != '') {
            console.log("You can start the cli with `start` argument. E.g., `node file.js start`.")
        }
    }
}

handleCli(); 