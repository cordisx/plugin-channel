import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

test("publishes exact formal Protocol and Host baselines", async () => {
  const status = await import("../dist/status.js");
  assert.equal(status.CHANNEL_PLUGIN_STATUS, "package-verification");
  assert.equal(status.REQUIRED_BASELINES.host, "406e8258d28039c5c567077a287116b168ec7d63");
  assert.equal(status.REQUIRED_BASELINES.protocol, "e497be9a3f001323deac481abccbf0e9f0924b46");
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

test("uses its own management service without requesting delegated account or binding grants", async () => {
  const source = await import("../dist/channel.js");
  for (
    const name of [
      "channel.bindings.write",
      "channel.accounts.connect",
      "channel.accounts.read",
      "channel.bindings.read",
    ]
  ) {
    const capability = source.manifest.capabilities.find(item => item.name === name);
    assert.equal(capability, undefined);
  }
});

test("uses the public Host new-action icon token for the create page", async () => {
  const source = await import("../dist/channel.js");
  // The bundled source keeps page metadata as a local constant; assert the public token is present and the removed token is absent.
  const bundled = await readFile(new URL("../dist/channel.js", import.meta.url), "utf8");
  assert.match(bundled, /host:new/);
  assert.doesNotMatch(bundled, /host:create/);
  assert.equal(source.manifest.id, "channel");
});
