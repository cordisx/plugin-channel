import assert from "node:assert/strict";
import { test } from "node:test";
import { withConfigurationHeader } from "../dist/configuration-header.js";

test("header operations target the live page and refresh without remounting its draft", async () => {
  let state = "ready", allowed = true, mounted = 0, unmounted = 0;
  const commands = new Map(), listeners = new Set(), calls = [], notices = [], labels = [];
  const operations = ["connection.enable", "connection.disable", "connection.reconnect"];
  const manager = {
    snapshot: () => ({
      profileId: "profile",
      hostGeneration: "generation",
      revision: 3,
      accounts: ["chosen", "other"].map(connectionToken => ({
        connectionToken,
        connectionState: state,
        availableOperations: allowed ? operations : [],
      })),
    }),
    subscribe: listener => {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
    execute: async request => {
      calls.push(request);
      return { status: "applied" };
    },
  };
  const ctx = {
    commands: {
      register: (metadata, handler) => {
        assert.ok(!commands.has(metadata.id));
        commands.set(metadata.id, handler);
        return () => commands.delete(metadata.id);
      },
    },
    notifications: { show: notice => notices.push(notice) },
  };
  const lifetime = new AbortController();
  const mount = withConfigurationHeader(ctx, manager, () => {
    mounted += 1;
    return () => unmounted += 1;
  });
  const dispose = mount({
    params: { connectionToken: "chosen" },
    signal: lifetime.signal,
    controls: { setHeaderActionLabel: (...values) => labels.push(values) },
    localization: { getSnapshot: () => ({ locale: "en" }) },
  });
  try {
    await commands.get("toggle-connection")();
    assert.equal(calls[0].operation, "connection.disable");
    assert.equal(calls[0].target.connectionToken, "chosen");
    state = "disabled";
    for (const listener of listeners) listener();
    assert.equal(mounted, 1);
    assert.equal(labels.at(-1)[1].key, "connection.enable");
    await commands.get("toggle-connection")();
    await commands.get("reconnect-connection")();
    assert.equal(calls[1].operation, "connection.enable");
    assert.equal(calls[2].operation, "connection.reconnect");
    const stale = commands.get("toggle-connection");
    allowed = false;
    for (const listener of listeners) listener();
    await stale();
    assert.equal(calls.length, 3);
    assert.equal(commands.size, 0);
    allowed = true;
    for (const listener of listeners) listener();
    lifetime.abort();
    await stale();
    assert.equal(calls.length, 3);
    assert.equal(commands.size, 0);
    assert.equal(listeners.size, 0);
    assert.equal(notices.length, 3);
  } finally {
    dispose();
  }
  assert.equal(unmounted, 1);
});
