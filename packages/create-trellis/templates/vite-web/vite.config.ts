import { cp } from "node:fs/promises";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

// The game loads assets/ and scenes/ by path at runtime instead of importing
// them, so Vite doesn't include them in a build. Copy them in as they are.
function copyGameFiles(dirs: string[]): Plugin {
    let root = "";
    let outDir = "";
    return {
        name: "copy-game-files",
        apply: "build",
        configResolved(config) {
            root = config.root;
            outDir = path.resolve(config.root, config.build.outDir);
        },
        async closeBundle() {
            for (const dir of dirs) {
                await cp(path.join(root, dir), path.join(outDir, dir), { recursive: true });
            }
        },
    };
}

export default defineConfig({
    // Relative paths, so a build works from any folder (itch.io, GitHub Pages, ...).
    base: "./",
    plugins: [copyGameFiles(["assets", "scenes"])],
    build: {
        rolldownOptions: {
            output: {
                // The engine's SceneLoader matches components by class name,
                // so production builds must not mangle class names.
                keepNames: true,
            },
        },
    },
});
