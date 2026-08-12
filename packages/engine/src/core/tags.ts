import {Aspect} from "../model/index.js";

export class Tags extends Aspect {
    #tags: Set<string>;
    constructor(tags?: string[]) {
        super();
        this.#tags = new Set(tags ?? []);
    }
    has(tag: string) {
        return this.#tags.has(tag);
    }
    add(tag: string) {
        this.#tags.add(tag);
    }
    delete(tag: string) {
        this.#tags.delete(tag);
    }
}