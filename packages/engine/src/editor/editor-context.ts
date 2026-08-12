import {GameObject} from "../model/index.js";
import {SceneLoader} from "../stl/index.js";

export type EditorContext = {
    selected: GameObject | null;
    mode: "position" | "scale";
    sceneLoader: SceneLoader;
    scenePath: string;
}