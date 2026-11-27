import { Uuid } from "../utils/uuid.js";
import { Component, type ComponentConstructor } from "./component.js"
import { Registry } from "./registry.js";
import {Behavior, type BehaviorConstructor} from "./behavior.js";

import { Transform} from "../core/transform.js";

/**
 * C is the set of components this object is known to have. `in` makes an object
 * with more components usable anywhere one with fewer is expected.
 */
export class GameObject<in C extends Component = Transform> {
    #uuid: Uuid;
    #registry: Registry;
    #behaviors: Map<BehaviorConstructor<any,any>, Behavior<any>>;
    constructor(registry: Registry) {
        this.#registry = registry;
        this.#uuid = new Uuid();
        this.#behaviors = new Map();

        this.add(new Transform());
    }
    get<T extends C>(type: ComponentConstructor<T>): T;
    get<T extends Component>(type: ComponentConstructor<T>): T | undefined;
    get(type: ComponentConstructor): Component | undefined {
        return this.#registry.getComponent(this as GameObject<any>, type);
    }
    add<T extends Component>(component: T): GameObject<C | T> {
        this.#registry.addComponent(this as GameObject<any>, component);
        return this as GameObject<C | T>;
    }
    /**
     * Narrows the type to include T, throwing if the object doesn't have it.
     * Use where the component set was lost, e.g. `onInit` callbacks or query results:
     * `gameObject.expect(SpriteRenderer).attach(...)`.
     */
    expect<T extends Component>(type: ComponentConstructor<T>): GameObject<C | T> {
        if (!this.get(type)) {
            throw new Error(`Game Object ${this.uuid.id} has no ${type.name}`);
        }
        return this as GameObject<C | T>;
    }
    // `this: GameObject<N>` only matches if the object already has every component N needs.
    attach<T extends Behavior<N>, N extends Component>(
        this: GameObject<NoInfer<N>>,
        type: new (go: GameObject<N>) => T
    ): T;
    attach<T extends Behavior<N>, N extends Component, TConfig>(
        this: GameObject<NoInfer<N>>,
        type: new (go: GameObject<N>, config: TConfig) => T,
        config: TConfig
    ): T;
    attach(type: any, config?: any): Behavior<any> {
        const existing = this.#behaviors.get(type);
        if (existing) {
            console.error(`Tried to add behavior ${type.name} multiple times to Game Object ${this.uuid.id}`);
            return existing;
        }
        for (const required of type.requires) {
            if (!this.get(required)) {
                throw new Error(`Behavior ${type.name} requires ${required.name} on Game Object ${this.uuid.id}`);
            }
        }
        const behavior = new type(this, config);
        this.#behaviors.set(type, behavior);
        return behavior;
    }
    get uuid() {
        return this.#uuid;
    }
    get transform() {
        return this.get(Transform)!;
    }
    get components(): readonly Component[] {
        return this.#registry.getComponents(this as GameObject<any>);
    }
    get behaviors() {
        return this.#behaviors.values();
    }
}