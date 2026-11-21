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
  define: { ...graph.define, __CORDISX_GRAPH_STYLES__: "true" },
});

await copyFile("src/service.mjs", "dist/service.mjs");
