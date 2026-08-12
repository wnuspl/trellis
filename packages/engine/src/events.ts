import {Uuid} from "./utils/index.js";
import type {GameObject} from "./model/game-object.js";

type Constructor<T> = new(...args: any[]) => T;
export class FrameEventStore {
    #map: Map<any, any>;
    constructor() {
        this.#map = new Map();
    }
    post<T extends FrameEvent>(event: T): void {
        const key = event.constructor;
        if (!this.#map.has(key)) {
            this.#map.set(key, []);
        }
        const list = this.#map.get(key)!;
        list.push(event);
    }
    get<T extends FrameEvent>(key: Constructor<T>): T[] {
        return this.#map.get(key) ?? [];
    }
    getFor<T extends FrameEvent>(key: Constructor<T>, gameObject: GameObject): T[] {
        const list = this.#map.get(key) ?? [];
        return list.flatMap((event: T) => {
            if (!event.involves(gameObject)) return [];
            return event.for(gameObject);
        });
    }
    clear() {
        this.#map.clear();
    }
}

export type FrameEventStoreView = {
    get: <T extends FrameEvent>(key: Constructor<T>) => T[];
    getFor: <T extends FrameEvent>(key: Constructor<T>, gameObject: GameObject) => T[];
}


export class FrameEvent {
    protected involvedGameObjects: Set<GameObject> = new Set();
    involves(gameObject: GameObject) {
        if (this.involvedGameObjects.size == 0) return true;
        return this.involvedGameObjects.has(gameObject);
    }
    for(gameObject: GameObject): FrameEvent {
        return this;
    }
}