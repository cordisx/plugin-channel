import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

test("publishes exact formal Protocol and Host baselines", async () => {
  const status = await import("../dist/status.js");
  assert.equal(status.CHANNEL_PLUGIN_STATUS, "package-verification");
  assert.equal(status.REQUIRED_BASELINES.host, "dfb071e02eca0ef52f84d67b2393c25aced7d3f0");
  assert.equal(status.REQUIRED_BASELINES.protocol, "3f0dbcd8b04ae83c920d2d913ac2c313af5f83f1");
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
