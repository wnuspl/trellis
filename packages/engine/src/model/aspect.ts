import type {Tracked} from "../tracked.js";

export interface AspectConstructor<T extends Aspect = Aspect> {
    new (...args: any[]): T;
    from(data: object): Aspect
}

export class Aspect implements Tracked {
    _notifyModificationInternal: (() => void) | undefined;
    _modified: boolean = false;
    _reset() {
        this._modified = false;
    }
    get _notifyModification() {
        return this._notifyModificationInternal;
    }
    set _notifyModification(callback: (() => void) | undefined) {
        this._notifyModificationInternal = callback;
    }
    static from(data: object): Aspect {
        console.error(`Aspect from ${this.name} used but not defined`);
        return new Aspect();
    }
}