import { build } from "esbuild";
import { copyFile } from "node:fs/promises";
import { build as viteBuild } from "vite";
import { cordisXPluginViteConfig } from "cordisx/vite";

await build({
  bundle: true,
  entryPoints: ["src/channel.ts"],
  external: [
    "@deepseek-ai/cordis",
    "@cordisx/protocol/channel-manager/v2",
    "@cordisx/protocol/channel-manager/v3",
    "@cordisx/protocol/channel-manager/v4",
    "@cordisx/protocol/channel-manager/v5",
    "@cordisx/protocol/channel-manager/v6",
    "@cordisx/protocol/channel-manager/v7",
    "@cordisx/protocol/manager-content-navigation/v6",
    "@cordisx/protocol/manager-collection/v2",
    "cordisx/contracts",
    "cordisx/react",
    "cordisx/react/jsx-runtime",
    "cordisx/react/jsx-dev-runtime",
    "cordisx/ui",
  ],
  format: "esm",
  loader: { ".css": "text" },
  metafile: true,
  // Module-boundary comments can contain the real path of a symlinked build
  // dependency. Keep the legacy bundle portable across build machines.
  minifyWhitespace: true,
  outfile: "dist/channel.js",
  platform: "browser",
  sourcemap: false,
  target: ["chrome120"],
  define: { __CORDISX_GRAPH_STYLES__: "false" },
});

const graph = cordisXPluginViteConfig({
  root: process.cwd(),
  entry: "./src/channel-graph.ts",
  outDir: "./dist/browser",
  entryFileName: "module.js",
});
await viteBuild({
  ...graph,
  configFile: false,
  // Native module loading owns the indexed stylesheet. An older Host that
  // bundles this entry into an IIFE has no import.meta URL and uses the inline
  // fallback. The separate legacy entry above always keeps that fallback.
  define: { ...graph.define, __CORDISX_GRAPH_STYLES__: "Boolean(import.meta.url)" },
});

await copyFile("src/service.mjs", "dist/service.mjs");
