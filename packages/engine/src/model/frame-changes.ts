import type {GameObject} from "./game-object.js";
import type {AspectConstructor} from "./aspect.js";

export interface ReadonlyFrameChanges {
    readonly createdGameObjects: ReadonlySet<GameObject>;
    readonly modifiedGameObjects: ReadonlyMap<GameObject, readonly AspectConstructor[]>;
    readonly destroyedGameObjects: ReadonlySet<GameObject>;
}

export class MutableFrameChanges {
    createdGameObjects: Set<GameObject> = new Set();
    modifiedGameObjects: Map<GameObject, AspectConstructor[]> = new Map();
    destroyedGameObjects: Set<GameObject> = new Set();
}