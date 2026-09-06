import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

test("publishes an explicit nonfunctional extraction checkpoint", async () => {
  const status = await import("../dist/status.js");
  assert.equal(status.CHANNEL_PLUGIN_STATUS, "host-provider-pending");
  assert.equal(status.REQUIRED_BASELINES.host, "1cbe9d0ff1a803b1486bb2ddcbedc98a187d4f11");
  assert.equal(status.REQUIRED_BASELINES.protocol, "9654023d1b1077d6fd0d43a2d294459bab63216b");
});

test("keeps Host-private imports out of standalone source", async () => {
  const names = await readdir(new URL("../src/", import.meta.url), { recursive: true });
  const sources = await Promise.all(
    names.filter(name => /\.[cm]?[jt]sx?$/.test(name)).map(name =>
      readFile(new URL(`../src/${name}`, import.meta.url), "utf8")
    ),
  );
  for (const source of sources) {
    assert.doesNotMatch(source, /packages\/cli|\.\.\/\.\.\/(?:launcher|renderer)/);
  }
});

test("owns maintained Channel styles as a real stylesheet", async () => {
  const styles = await readFile(new URL("../src/channel.css", import.meta.url), "utf8");
  assert.match(styles, /\.cxc-channel-react/);
  assert.match(styles, /@media\s*\(width\s*<=\s*700px\)/);
  assert.doesNotMatch(styles, /<style>|const STYLES/);
});
