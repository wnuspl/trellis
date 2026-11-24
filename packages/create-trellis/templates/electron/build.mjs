import { context } from "esbuild";

const watch = process.argv.includes("--watch");

const shared = {
    bundle: true,
    sourcemap: true,
    logLevel: "info",
    // The engine's SceneLoader matches components by class name, so bundling
    // must not rename classes (esbuild would otherwise emit e.g. `_Transform`).
    keepNames: true,
};

const builds = [
    // Main process: Node, ESM (package.json has "type": "module").
    {
        ...shared,
        entryPoints: ["electron/main.ts"],
        outfile: "dist/main.js",
        platform: "node",
        format: "esm",
        external: ["electron"],
    },
    // Preload: sandboxed preloads must be CommonJS, hence .cjs.
    {
        ...shared,
        entryPoints: ["electron/preload.ts"],
        outfile: "dist/preload.cjs",
        platform: "node",
        format: "cjs",
        external: ["electron"],
    },
    // Renderer: the game itself, running in the browser window.
    {
        ...shared,
        entryPoints: ["src/index.ts"],
        outfile: "dist/renderer.js",
        platform: "browser",
        format: "esm",
    },
];

const contexts = await Promise.all(builds.map((options) => context(options)));

if (watch) {
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log("Watching for changes...");
} else {
    await Promise.all(contexts.map((ctx) => ctx.rebuild()));
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
}
