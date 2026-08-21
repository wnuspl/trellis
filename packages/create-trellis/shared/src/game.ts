import {Profile, Transform} from "@wnuspl/trellis";
import {ResourceLoader, SceneLoader} from "@wnuspl/trellis/stl";
import { Watermelon, Player } from "./blueprints.js";

export function runGame(profile: Profile, resourceLoader: ResourceLoader) {
    const sceneLoader = new SceneLoader(resourceLoader);
    sceneLoader.register(
        {
            "alias": "player",
            blueprint: Player,
            targetComponentTypes: [Transform]
        },
        {
            "alias": "watermelon",
            blueprint: Watermelon,
            targetComponentTypes: [Transform]
        }
    );

    const main = profile.instance.createScene("main");

    main.onInit((scene) => {
        sceneLoader.load(scene, "./scenes/main.json");
    });

    profile.instance.systems.sceneManager.setScene("main");
    profile.init();
}