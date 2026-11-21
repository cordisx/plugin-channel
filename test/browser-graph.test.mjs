import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the indexed browser graph keeps Channel styles in verified initial resources", async () => {
  const root = new URL("../dist/browser/", import.meta.url);
  const artifact = JSON.parse(await readFile(new URL("artifact.json", root), "utf8"));
  assert.equal(artifact.contract, "cordisx.plugin-generation-artifact/v1");
  assert.equal(artifact.entry, "./module.js");
  assert.equal(artifact.initialStyles.length, 1);
  const sheet = artifact.files.find(file => file.path === artifact.initialStyles[0]);
  assert.equal(sheet?.kind, "stylesheet");
  const css = await readFile(new URL(sheet.path, root));
  assert.equal(`sha256:${createHash("sha256").update(css).digest("hex")}`, sheet.digest);
  assert.match(css.toString("utf8"), /\.cxc-channel-react\s*\{/);
  assert.match(css.toString("utf8"), /display\s*:\s*flex/);
  const graphModule = await readFile(new URL(artifact.entry, root), "utf8");
  assert.doesNotMatch(graphModule, /\.cxc-channel-react\s*\{/);
  const legacyModule = await readFile(new URL("../dist/channel.js", import.meta.url), "utf8");
  assert.match(legacyModule, /\.cxc-channel-react\s*\{/);
  assert.match(legacyModule, /jsx\d*\("style"/);
});
