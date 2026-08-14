import type {Tracked} from "../tracked.js";

export interface ComponentConstructor<T extends Component = Component> {
    new (...args: any[]): T;
    from(data: object): Component
}

export class Component implements Tracked {
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
    static from(data: object): Component {
        console.error(`Component from ${this.name} used but not defined`);
        return new Component();
    }
}