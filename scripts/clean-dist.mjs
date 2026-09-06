import { rm } from "node:fs/promises";

const output = new URL("../dist/", import.meta.url);
if (!output.pathname.endsWith("/plugin-channel/dist/")) {
  throw new Error(`Refusing to clean unexpected output directory: ${output.pathname}`);
}
await rm(output, { recursive: true, force: true });
