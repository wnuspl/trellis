import type {GameObject} from "./game-object.js";
import type {ComponentConstructor} from "./component.js";

export interface ReadonlyFrameChanges {
    readonly createdGameObjects: ReadonlySet<GameObject>;
    readonly modifiedGameObjects: ReadonlyMap<GameObject, readonly ComponentConstructor[]>;
    readonly destroyedGameObjects: ReadonlySet<GameObject>;
}

export class MutableFrameChanges {
    createdGameObjects: Set<GameObject> = new Set();
    modifiedGameObjects: Map<GameObject, ComponentConstructor[]> = new Map();
    destroyedGameObjects: Set<GameObject> = new Set();
}