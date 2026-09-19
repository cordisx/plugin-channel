import { readFile, writeFile } from "node:fs/promises";

const image = await readFile(new URL("../assets/channel.png", import.meta.url));
const lines = image.toString("base64").match(/.{1,100}/g);
await writeFile(
  new URL("../src/brand-icon.ts", import.meta.url),
  "// Generated from assets/channel.png; regenerate with node scripts/generate-brand-icon.mjs.\n"
    + "import type { CordisXPluginBrandIcon } from \"cordisx/contracts\";\n\n"
    + "export const icon = {\n  mediaType: \"image/png\",\n  data: [\n"
    + lines.map(line => `    "${line}",`).join("\n")
    + "\n  ].join(\"\"),\n} satisfies CordisXPluginBrandIcon;\n",
);
