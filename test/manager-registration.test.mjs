import assert from "node:assert/strict";
import { test } from "node:test";
import { apply } from "../dist/channel.js";

test("uses the owned reply-policy successor when available and keeps policy controls on older Hosts", async () => {
  let configured = 0, oldConfigured = 0;
  const commands = new Map();
  const effects = [];
  const manager = {
    forOwnReplyService() {
      return this;
    },
    snapshot: () => ({ accounts: [], availableOperations: [] }),
    subscribe: () => ({ dispose() {} }),
    configureConversationReplyPolicy: async () => {
      configured += 1;
      return { status: "cancelled", code: "CANCELLED" };
    },
    configureConversationPolicy: async () => {
      oldConfigured += 1;
      return { status: "cancelled", code: "CANCELLED" };
    },
  };
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: manager,
    pages: { register: () => () => {} },
    routes: { register() {}, navigate: async () => {} },
    commands: { register: (metadata, handler) => commands.set(metadata.id, handler) },
    managerContent: { replaceProjection: () => () => {} },
    effect: setup => effects.push(setup()),
    slots: { register() {} },
  };
  try {
    apply(ctx);
    await commands.get("configure-policy")({ signal: new AbortController().signal });
    assert.equal(configured, 1);
    assert.equal(oldConfigured, 0);
  } finally {
    for (const dispose of effects.reverse()) dispose();
  }
});

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
      forOwnService() {
        return this;
      },
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
  const action = id => pages.get("settings").headerActions.find(item => item.id === id);
  try {
    assert.equal(slots.length, 1);
    assert.equal(slots[0].options.schemaVersion, 11);
    assert.match(slots[0].options.$schema, /surface-contribution\.v11\.schema\.json$/);
    assert.deepEqual(slots[0].item.navigationGroup, { id: "external-accounts" });
    assert.equal(action("create").disabled.value, true);
    assert.equal(action("create").command.id, "open-create");
    assert.equal(action("policy").disabled.value, true);
    await commands.get("configure-policy")({ signal: new AbortController().signal });
    await commands.get("open-create")({ signal: new AbortController().signal });
    assert.deepEqual(navigation, []);
    for (const listener of listeners) listener();
    assert.equal(listRegistrations, 1, "Unchanged creation capability must preserve the mounted page");
    snapshot = { ...snapshot, availableOperations: ["target.connection.create.simulator"] };
    for (const listener of listeners) listener();
    assert.equal(action("create").disabled.value, false);
    await commands.get("open-create")({ signal: new AbortController().signal });
    assert.deepEqual(navigation, [{ id: "create" }]);
    await commands.get("open-create")({ signal: AbortSignal.abort() });
    snapshot = { ...snapshot, availableOperations: [] };
    for (const listener of listeners) listener();
    await commands.get("open-create")({ signal: new AbortController().signal });
    assert.deepEqual(navigation, [{ id: "create" }], "Revocation and abort must not navigate using stale capability");
    assert.equal(action("create").disabled.value, true);
  } finally {
    for (const dispose of effects.reverse()) dispose();
  }
  assert.equal(listeners.size, 0);
  assert.equal(pages.has("settings"), false);
});

test("opens a policy child route and refreshes the shared summary from public identity snapshots", async () => {
  const previousDocument = globalThis.document;
  globalThis.document = { documentElement: { lang: "en" } };
  let snapshot = {
    accounts: [{
      connectionToken: "opaque",
      adapterKind: "feishu",
      displayName: "Test connection",
      connectionState: "ready",
      configurationState: "ready",
      inbound: { pending: 2, retrying: 1, deadLetter: 0 },
      outbound: { pending: 0, retrying: 0, deadLetter: 1 },
    }],
    availableOperations: [],
  };
  const listeners = new Set(), effects = [], navigation = [], projections = [];
  const commands = new Map();
  let modal = 0;
  const manager = {
    forOwnPageService() {
      return this;
    },
    snapshot: () => snapshot,
    snapshotWithIdentity: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
    mountConversationReplyPolicyForm() {},
    configureConversationReplyPolicy() {
      modal += 1;
    },
  };
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: manager,
    pages: { register: () => () => {} },
    routes: { register() {}, navigate: async route => navigation.push(route) },
    commands: { register: (metadata, handler) => commands.set(metadata.id, handler) },
    managerContent: {
      supportedSchemaVersions: [1, 2, 3, 4, 5, 6],
      replaceProjection: projection => {
        projections.push(projection);
        return () => {};
      },
    },
    effect: setup => effects.push(setup()),
    slots: { register() {} },
  };
  try {
    apply(ctx);
    await commands.get("configure-policy")({ signal: new AbortController().signal });
    assert.deepEqual(navigation, [{ id: "policy" }]);
    assert.equal(modal, 0);
    const projection = projections.at(-1);
    assert.deepEqual(projection.declarations.find(item => item.id === "policy").parentRoute, { id: "settings" });
    const summaries = projection.declarations.filter(item => item.schemaVersion === 6).map(item => item.recordSummary);
    assert.equal(summaries.length, 4);
    assert.ok(summaries.every(item => item.metrics[0].value === 3 && item.leadingVisual.kind === "identity"));
    snapshot = {
      ...snapshot,
      accounts: [{ ...snapshot.accounts[0], inbound: { pending: 0, retrying: 0, deadLetter: 0 } }],
    };
    for (const listener of listeners) listener();
    assert.equal(
      projections.at(-1).declarations.find(item => item.schemaVersion === 6).recordSummary.metrics[0].value,
      0,
    );
  } finally {
    for (const dispose of effects.reverse()) dispose();
    globalThis.document = previousDocument;
  }
  assert.equal(listeners.size, 0);
});
