export class Uuid {
    static #next: number = 0;
    #id: number;
    constructor() {
        this.#id = Uuid.#next++;
    }
    get id() {
        return this.#id;
    }
    // static force(id: number) {
    //     const realNext = Uuid.#next;
    //     Uuid.#next = id;
    //     const uuid = new Uuid();
    //     Uuid.#next = realNext;
    //     return uuid;
    // }
}