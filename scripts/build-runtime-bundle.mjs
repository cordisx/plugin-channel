import { build } from "esbuild";
import { copyFile } from "node:fs/promises";

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
});

await copyFile("src/service.mjs", "dist/service.mjs");
