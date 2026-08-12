import {GameProfile, SceneLoader}  from "@wnuspl/trellis/stl";
import {Profile, Transform} from "@wnuspl/trellis";
import {resourceLoader} from "./resource-loader.js";
import {Player, Watermelon} from "./blueprints.js";
import {EditorProfile} from "@wnuspl/trellis/editor";

const sceneLoader = new SceneLoader(resourceLoader);

const profile: Profile = (() => {
    const path = window.location.pathname.slice(1).split("/");
    return (path.shift() === "editor")
        ? new EditorProfile({
            mount: document.body,
            sceneLoader,
            scenePath: path.join("/")
        })
        : new GameProfile({
            mount: document.body,
        });
})();


profile.instance.config.assetFileNameList = Object.keys(import.meta.glob("/assets/*"));

sceneLoader.register(
    {
        "alias": "player",
        blueprint: Player,
        targetAspectTypes: [Transform]
    },
    {
        "alias": "watermelon",
        blueprint: Watermelon,
        targetAspectTypes: [Transform]
    }
);

const main = profile.instance.createScene("main");

main.onInit((scene) => {
    sceneLoader.load(scene, "./scenes/main.json");
});

profile.instance.systems.sceneManager.setScene("main");
profile.init();
