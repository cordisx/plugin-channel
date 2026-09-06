import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "dist");
if (dirname(output) !== root) {
  throw new Error(`Refusing to clean unexpected output directory: ${output}`);
}
await rm(output, { recursive: true, force: true });
