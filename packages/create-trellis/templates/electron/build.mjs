import { build } from "esbuild";

await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: "dist/index.js",
    external: ["electron"],
});

await build({
    entryPoints: ["src/preload.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: "dist/preload.js",
    external: ["electron"],
});