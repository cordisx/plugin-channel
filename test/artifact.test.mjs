import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "node:test";

test("builds a bounded standalone browser module with owned CSS", async () => {
  const entry = new URL("../dist/channel.js", import.meta.url);
  const [metadata, source] = await Promise.all([stat(entry), readFile(entry, "utf8")]);
  assert.ok(metadata.size > 0);
  assert.ok(metadata.size < 24 * 1024 * 1024);
  assert.match(source, /\.cxc-channel-react/);
  assert.doesNotMatch(source, /packages\/cli|src\/renderer|src\/launcher/);
});

test("exports the v8 renderer manifest without a private Node service", async () => {
  const plugin = await import("../dist/channel.js");
  assert.equal(plugin.manifest.schemaVersion, 8);
  assert.equal(plugin.manifest.id, "channel");
  assert.deepEqual(plugin.manifest.services, []);
  assert.ok(plugin.inject.includes("channelManager"));
});
