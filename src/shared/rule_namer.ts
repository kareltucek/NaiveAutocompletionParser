export class RuleNamer {
    static nameIdx: number = 0;

    static newName(base: string, tag: string): string {
        let id = RuleNamer.nameIdx++;
        return base.toUpperCase() + "_" + tag.toUpperCase() + "_" + "ID" + id;
    }

    static newNameFor<T>(base: string, tag: string, closure: (name: string) => T): T {
        return closure(RuleNamer.newName(base, tag));
    }
}