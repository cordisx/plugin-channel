import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

test("publishes an explicit nonfunctional extraction checkpoint", async () => {
  const status = await import("../dist/status.js");
  assert.equal(status.CHANNEL_PLUGIN_STATUS, "public-contract-pending");
  assert.equal(status.REQUIRED_BASELINES.host, "1cbe9d0ff1a803b1486bb2ddcbedc98a187d4f11");
  assert.equal(status.REQUIRED_BASELINES.protocol, "703a3d03f1b533c4d54bf51e5c8818b53bdda4f5");
});

test("keeps Host-private imports out of standalone source", async () => {
  const names = await readdir(new URL("../src/", import.meta.url));
  const sources = await Promise.all(
    names.filter(name => /\.[cm]?[jt]sx?$/.test(name)).map(name =>
      readFile(new URL(`../src/${name}`, import.meta.url), "utf8")
    ),
  );
  for (const source of sources) {
    assert.doesNotMatch(source, /packages\/cli|\.\.\/\.\.\/(?:launcher|renderer)|channelManager/);
  }
});

test("owns maintained Channel styles as a real stylesheet", async () => {
  const styles = await readFile(new URL("../src/channel.css", import.meta.url), "utf8");
  assert.match(styles, /\.cxc-channel-react/);
  assert.match(styles, /@media\s*\(width\s*<=\s*700px\)/);
  assert.doesNotMatch(styles, /<style>|const STYLES/);
});
