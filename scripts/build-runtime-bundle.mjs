import { build } from "esbuild";

await build({
  bundle: true,
  entryPoints: ["src/channel.ts"],
  external: [
    "@deepseek-ai/cordis",
    "@cordisx/protocol/channel-manager/v2",
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
