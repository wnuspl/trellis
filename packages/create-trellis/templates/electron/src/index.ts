import {GameProfile, ResourceLoader, SceneLoader, SpriteRenderer} from "@wnuspl/trellis/stl";
import {Blueprint, Profile, Transform} from "@wnuspl/trellis";
import {EditorProfile} from "@wnuspl/trellis/editor";
import {runGame} from "./game.js";

const resourceLoader = new ResourceLoader({
    read: async (path: string) => window.trellis.read(path),
    write: async (path: string, data: string) => window.trellis.write(path, data),
});

const sceneLoader = new SceneLoader(resourceLoader);

const editor = false;

const profile: Profile = (() => {
    return editor
        ? new EditorProfile({
            mount: document.body,
            sceneLoader,
            scenePath: "scenes/main.json"
        })
        : new GameProfile({
            mount: document.body,
        });
})();


(async () => {
    const assets = (await window.trellis.ls("assets"))
        .map(fileName => `assets/${fileName}`);
    console.log(assets);
    profile.instance.config.assetFileNameList = assets;

    runGame(profile, resourceLoader);
})();

