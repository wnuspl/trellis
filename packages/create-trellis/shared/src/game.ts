import { Transform, type Profile } from "@wnuspl/trellis";
import { GameProfile, ResourceLoader, SceneLoader } from "@wnuspl/trellis/stl";
import { EditorProfile } from "@wnuspl/trellis/editor";
import { Watermelon, Player } from "./blueprints.js";

// Platform-independent game setup. Each template's src/index.ts supplies the
// platform pieces (file access, the asset list) and calls startGame().

export type GameOptions = {
    mount: HTMLElement;
    resourceLoader: ResourceLoader;
    assets: string[];
    editor?: boolean;
    scenePath?: string;
};

export function createSceneLoader(resourceLoader: ResourceLoader): SceneLoader {
    const sceneLoader = new SceneLoader(resourceLoader);
    // Components a scene file may store. The keys are the names used in the file.
    sceneLoader.components({ Transform });
    sceneLoader.register(
        { alias: "player", blueprint: Player },
        { alias: "watermelon", blueprint: Watermelon },
    );
    return sceneLoader;
}

export async function startGame({
    mount,
    resourceLoader,
    assets,
    editor = false,
    scenePath = "scenes/main.json",
}: GameOptions): Promise<Profile> {
    const sceneLoader = createSceneLoader(resourceLoader);

    const profile: Profile = editor
        ? new EditorProfile({ mount, sceneLoader, scenePath })
        : new GameProfile({ mount });
    profile.instance.config.assetFileNameList = assets;

    if (!editor) {
        // EditorProfile loads the scene itself; the game does it here.
        const main = profile.instance.createScene("main");
        main.onInit(async (scene) => {
            await sceneLoader.load(scene, scenePath);
        });
        profile.instance.systems.sceneManager.setScene("main");
    }

    await profile.init();
    return profile;
}
