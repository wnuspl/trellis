import { Uuid } from "../utils/uuid.js";
import { Component, type ComponentConstructor } from "./component.js"
import { Registry } from "./registry.js";
import {Behavior, type BehaviorConstructor} from "./behavior.js";

import { Transform} from "../core/transform.js";

type AttachBehaviorMethod = {
    <T extends Behavior>(
        type: new (go: GameObject) => T
    ): T;
    <T extends Behavior, TConfig>(
        type: new (go: GameObject, config: TConfig) => T,
        config: TConfig
    ): T;
};

export class GameObject {
    #uuid: Uuid;
    #registry: Registry;
    #behaviors: Map<BehaviorConstructor<any,any>, Behavior>;
    constructor(registry: Registry) {
        this.#registry = registry;
        this.#uuid = new Uuid();
        this.#behaviors = new Map();

        this.add(new Transform());
    }
    public readonly get = <T extends Component>(type: ComponentConstructor<T>): T | undefined => {
        return this.#registry.getComponent(this, type);
    }
    public readonly add = <T extends Component>(component: T): this => {
        this.#registry.addComponent(this, component);
        return this;
    }
    public readonly attach: AttachBehaviorMethod = (type: any, config?: any) => {
        const behavior = new type(this, config);
        if (this.#behaviors.has(type)) {
            console.error(`Tried to add behavior ${type.name} multiple times to Game Object ${this.uuid}`);
            return;
        }
        this.#behaviors.set(type, behavior);
        return this;
    }
    get uuid() {
        return this.#uuid;
    }
    get transform() {
        return this.get(Transform)!;
    }
    get behaviors() {
        return this.#behaviors.values();
    }
}