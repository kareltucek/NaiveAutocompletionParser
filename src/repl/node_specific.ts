export function fsConstructor(): any {
    return require('fs');
}

export function promptSyncConstructor(): any {
    const prompt = require('prompt-sync');
    return prompt();
}