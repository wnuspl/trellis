import { Uuid } from "../utils/uuid.js";
import { Aspect, type AspectConstructor } from "./aspect.js"
import { Registry } from "./registry.js";
import {Behavior, type BehaviorConstructor} from "./behavior.js";

import { Tags } from "../core/tags.js";
import { Transform} from "../core/transform.js";

type GetAspectMethod = {
    (type: typeof Transform): Readonly<Transform>;
    (type: typeof Tags): Readonly<Tags>;
    <T extends Aspect>(type: AspectConstructor<T>): Readonly<T> | undefined;
};
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
        this.add(new Tags());
    }
    public readonly get: GetAspectMethod= ((aspect: AspectConstructor) => {
        return this.#registry.getAspect(this, aspect);
    }) as GetAspectMethod;
    public readonly modify = <T extends Aspect>(type: AspectConstructor<T>, modifier: (aspect: T) => void) => {
        this.#registry.modifyAspect(this, type, modifier);
    }
    public readonly add = <T extends Aspect>(aspect: T): this => {
        this.#registry.addAspect(this, aspect);
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
    get behaviors() {
        return this.#behaviors.values();
    }

}