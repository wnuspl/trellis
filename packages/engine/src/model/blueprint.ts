import type {GameObject} from "./game-object.js";

/**
 * Child blueprints, either named or listed. Names are how scene files address
 * a child, so prefer a record: list positions ("0", "1", ...) change when the
 * list is reordered.
 */
export type BlueprintChildren = Blueprint[] | Record<string, Blueprint>;

export const PATH_SEPARATOR = "/";

export class Blueprint {
    constructor(
        readonly build: (gameObject: GameObject) => void = () => {},
        readonly children: () => BlueprintChildren = () => [],
    ) {}
    /** Children as [key, blueprint] pairs. Lists use their positions as keys. */
    childEntries(): [string, Blueprint][] {
        const children = this.children();
        const entries: [string, Blueprint][] = Array.isArray(children)
            ? children.map((child, index) => [String(index), child])
            : Object.entries(children);
        return entries.filter(([key, child]) => {
            if (!(child instanceof Blueprint)) {
                console.error(`Blueprint child "${key}" is not a Blueprint (ignoring)`);
                return false;
            }
            if (key === "" || key.includes(PATH_SEPARATOR)) {
                console.error(`Blueprint child name "${key}" can't be empty or contain "${PATH_SEPARATOR}" (ignoring)`);
                return false;
            }
            return true;
        });
    }
}
