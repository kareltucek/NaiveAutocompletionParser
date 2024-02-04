
export class Suggestion {
    suggestion: string;
    overlap: number;

    constructor(suggestion: string, overlap: number) {
        this.suggestion = suggestion;
        this.overlap = overlap;
    }
}