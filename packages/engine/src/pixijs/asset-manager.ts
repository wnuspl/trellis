import {type ArrayOr, Assets, type AssetsBundle, type AssetsManifest, type UnresolvedAsset} from "pixi.js";


export class PixiAssetManager {
    #manifest: AssetsManifest;
    constructor() {
        this.#manifest = {
            bundles: []
        }
    }
    async registerAssetFiles(fileNameList: string[]) {
        const mainBundleAssets = [];
        for (const fileName of fileNameList) {
            const splitFileName = fileName.split("/");
            const alias = splitFileName.pop()!;

            mainBundleAssets.push({
                alias,
                src: fileName
            })
        }
        this.#manifest.bundles.push({
            name: "main",
            assets: mainBundleAssets
        })
        await this.#init();
    }
    async #init() {
        await Assets.init({ manifest: this.#manifest})
    }
    async load(bundleIds: ArrayOr<string> = 'main') {
        await Assets.loadBundle(bundleIds)
    }
    get(alias: string): any {
        return Assets.get(alias);
    }
}