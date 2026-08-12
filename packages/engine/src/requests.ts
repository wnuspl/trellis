import type {InstanceContext} from "./instance/instance-context.js";

type Constructor<T> = new(...args: any[]) => T;
export class FrameRequestStore {
    #map: Map<any, any>;
    constructor() {
        this.#map = new Map();
    }
    post<T extends FrameRequest>(event: T): void {
        const key = event.constructor;
        if (!this.#map.has(key)) {
            this.#map.set(key, []);
        }
        const list = this.#map.get(key)!;
        list.push(event);
    }
    get<T extends FrameRequest>(key: Constructor<T>): T[] {
        return this.#map.get(key) ?? [];
    }
    clear() {
        this.#map.clear();
    }
}

export class FrameRequest {
    post(ctx: InstanceContext) {
        ctx.requests.post(this);
    }
}
