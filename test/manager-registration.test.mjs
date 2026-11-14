import assert from "node:assert/strict";
import { test } from "node:test";
import { apply } from "../dist/channel.js";

test("registers reusable v11 navigation and fences the standard create action to current availability", async () => {
  let snapshot = { accounts: [], availableOperations: [] };
  const listeners = new Set();
  const pages = new Map();
  const commands = new Map();
  const navigation = [];
  const slots = [];
  const effects = [];
  let listRegistrations = 0;
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: {
      snapshot: () => snapshot,
      subscribe(listener) {
        listeners.add(listener);
        return { dispose: () => listeners.delete(listener) };
      },
    },
    pages: {
      register(metadata) {
        assert.equal(pages.has(metadata.id), false, "A replaced page must first retire the old registration");
        if (metadata.id === "settings") listRegistrations += 1;
        pages.set(metadata.id, metadata);
        return () => pages.delete(metadata.id);
      },
    },
    routes: { register() {}, navigate: async route => navigation.push(route) },
    commands: { register: (metadata, handler) => commands.set(metadata.id, handler) },
    managerContent: { replaceProjection: () => () => {} },
    effect: setup => effects.push(setup()),
    slots: { register: (options, item) => slots.push({ options, item }) },
  };
  apply(ctx);
  try {
    assert.equal(slots.length, 1);
    assert.equal(slots[0].options.schemaVersion, 11);
    assert.match(slots[0].options.$schema, /surface-contribution\.v11\.schema\.json$/);
    assert.deepEqual(slots[0].item.navigationGroup, { id: "external-accounts" });
    assert.equal(pages.get("settings").headerActions[0].disabled.value, true);
    assert.equal(pages.get("settings").headerActions[0].command.id, "open-create");
    await commands.get("open-create")({ signal: new AbortController().signal });
    assert.deepEqual(navigation, []);
    for (const listener of listeners) listener();
    assert.equal(listRegistrations, 1, "Unchanged creation capability must preserve the mounted page");
    snapshot = { ...snapshot, availableOperations: ["target.connection.create.simulator"] };
    for (const listener of listeners) listener();
    assert.equal(pages.get("settings").headerActions[0].disabled.value, false);
    await commands.get("open-create")({ signal: new AbortController().signal });
    assert.deepEqual(navigation, [{ id: "create" }]);
    await commands.get("open-create")({ signal: AbortSignal.abort() });
    snapshot = { ...snapshot, availableOperations: [] };
    for (const listener of listeners) listener();
    await commands.get("open-create")({ signal: new AbortController().signal });
    assert.deepEqual(navigation, [{ id: "create" }], "Revocation and abort must not navigate using stale capability");
    assert.equal(pages.get("settings").headerActions[0].disabled.value, true);
  } finally {
    for (const dispose of effects.reverse()) dispose();
  }
  assert.equal(listeners.size, 0);
  assert.equal(pages.has("settings"), false);
});
