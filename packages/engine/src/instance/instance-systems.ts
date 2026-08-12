import {PixiApplication, PixiAssetManager} from "../pixijs/index.js";
import type {SceneManager} from "./scene-manager.js";

export type InstanceSystems = {
    assetManager: PixiAssetManager;
    application: PixiApplication;
    sceneManager: SceneManager;
}
