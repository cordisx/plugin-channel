import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cloneBrandIconV1 } from "@cordisx/protocol/brand-icon/v1";

const icons = JSON.parse(await readFile(new URL("../src/platform-icons.json", import.meta.url), "utf8"));
const bytes = await readFile(new URL("../assets/platforms/feishu.png", import.meta.url));
assert.equal(icons.feishu.image.data, bytes.toString("base64"));
cloneBrandIconV1(icons.feishu);
console.log("Bundled Feishu platform artwork matches its bounded public raster snapshot.");
