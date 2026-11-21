import assert from "node:assert/strict";
import { test } from "node:test";
import { apply } from "../dist/channel.js";

test("snapshot-only presentation registers only read-only account status surfaces", () => {
  const priorDocument = globalThis.document;
  globalThis.document = { documentElement: { lang: "en" } };
  const pages = new Map(), routes = new Map(), commands = new Map(), projections = [], effects = [];
  const listeners = new Set();
  const account = {
    connectionToken: "opaque",
    adapterKind: "simulator",
    connectionState: "ready",
    configurationState: "ready",
    inbound: { pending: 0, retrying: 0, deadLetter: 0 },
    outbound: { pending: 0, retrying: 0, deadLetter: 0 },
    availableOperations: ["connection.disable"],
  };
  const manager = {
    forOwnPresentationService() {
      return this;
    },
    presentationCapabilities() {
      return {
        contract: "cordisx.channel-manager-presentation-capabilities/v1",
        schemaVersion: 1,
        mode: "snapshot-only",
      };
    },
    // Method presence and even stale advertised operations must not reopen settings.
    mountSettingsForm() {},
    mountBindingModelForm() {},
    mountConversationReplyPolicyForm() {},
    snapshot: () => ({
      accounts: [account],
      bindings: [],
      availableOperations: ["target.connection.create.simulator"],
    }),
    subscribe(listener) {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
  };
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: manager,
    pages: {
      register: metadata => {
        pages.set(metadata.id, metadata);
        return () => pages.delete(metadata.id);
      },
    },
    routes: {
      register: metadata => {
        routes.set(metadata.id, metadata);
      },
    },
    commands: {
      register: metadata => {
        commands.set(metadata.id, metadata);
      },
    },
    managerContent: {
      supportedSchemaVersions: [1, 6],
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
    assert.deepEqual([...routes.keys()].sort(), ["runtime", "settings"]);
    assert.deepEqual([...pages.keys()].sort(), ["runtime", "settings"]);
    assert.deepEqual(pages.get("settings").headerActions, []);
    assert.deepEqual([...commands.keys()], []);
    const projection = projections.at(-1);
    assert.deepEqual(projection.declarations.map(item => item.route.id).sort(), ["runtime", "settings"]);
    assert.deepEqual(projection.declarations.find(item => item.route.id === "runtime").tabs.map(tab => tab.id), [
      "runtime",
    ]);
  } finally {
    for (const dispose of effects.reverse()) dispose();
    globalThis.document = priorDocument;
  }
  assert.equal(listeners.size, 0);
});

test("configuration-only presentation exposes the existing form and status without unrelated controls", () => {
  const priorDocument = globalThis.document;
  globalThis.document = { documentElement: { lang: "en" } };
  const pages = new Map(), routes = new Map(), commands = new Map(), projections = [], effects = [];
  const accounts = [
    {
      connectionToken: "ready",
      adapterKind: "simulator",
      connectionState: "ready",
      availableOperations: ["connection.update"],
    },
    {
      connectionToken: "pending",
      adapterKind: "feishu",
      connectionState: "unavailable",
      lastErrorCode: "TENANT_IDENTIFICATION_PENDING",
      availableOperations: [],
    },
  ];
  const facade = {
    configurationPresentationCapabilities: () => ({
      contract: "cordisx.channel-manager-configuration-presentation-capabilities/v1",
      schemaVersion: 1,
      mode: "configuration-only",
    }),
    mountConnectionConfigurationForm() {},
    mountSettingsForm() {},
    snapshot: () => ({ accounts, bindings: [], availableOperations: ["target.connection.create.simulator"] }),
    subscribe: () => ({ dispose() {} }),
  };
  const manager = {
    forOwnConfigurationPresentationService: () => facade,
    forOwnPresentationService: () => {
      throw new Error("wrong facade");
    },
  };
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: manager,
    pages: {
      register: metadata => {
        pages.set(metadata.id, metadata);
        return () => pages.delete(metadata.id);
      },
    },
    routes: { register: metadata => routes.set(metadata.id, metadata) },
    commands: { register: metadata => commands.set(metadata.id, metadata) },
    managerContent: {
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
    assert.deepEqual([...routes.keys()].sort(), ["configuration", "runtime", "settings"]);
    assert.deepEqual([...pages.keys()].sort(), ["configuration", "runtime", "settings"]);
    assert.deepEqual(pages.get("settings").headerActions, []);
    assert.equal(pages.get("configuration").headerActions, undefined);
    assert.deepEqual([...commands.keys()], []);
    const declarations = projections.at(-1).declarations;
    const ready = declarations.find(item => item.route.id === "configuration");
    assert.deepEqual(ready.tabs.map(tab => tab.id), ["configuration", "runtime"]);
    const pending = declarations.find(item =>
      item.route.id === "runtime" && item.route.params.connectionToken === "pending"
    );
    assert.deepEqual(pending.tabs.map(tab => tab.id), ["runtime"]);
  } finally {
    for (const dispose of effects.reverse()) dispose();
    globalThis.document = priorDocument;
  }
});

test("configuration capability validation fails closed on incomplete or malformed facades", async () => {
  const { configurationOnlyPresentation } = await import("../dist/presentation-capabilities.js");
  const valid = {
    configurationPresentationCapabilities: () => ({
      contract: "cordisx.channel-manager-configuration-presentation-capabilities/v1",
      schemaVersion: 1,
      mode: "configuration-only",
    }),
    snapshot() {},
    subscribe() {},
    mountConnectionConfigurationForm() {},
  };
  assert.equal(configurationOnlyPresentation(valid), true);
  assert.equal(configurationOnlyPresentation({ ...valid, mountConnectionConfigurationForm: undefined }), false);
  assert.equal(
    configurationOnlyPresentation({ ...valid, configurationPresentationCapabilities: () => ({ mode: "standard" }) }),
    false,
  );
  assert.equal(
    configurationOnlyPresentation({
      ...valid,
      configurationPresentationCapabilities() {
        throw new Error("retired");
      },
    }),
    false,
  );
});

test("an invalid configuration facade cannot fall back to standard controls", () => {
  const pages = new Map(), routes = new Map(), commands = new Map(), effects = [];
  const old = {
    presentationCapabilities: () => ({
      contract: "cordisx.channel-manager-presentation-capabilities/v1",
      schemaVersion: 1,
      mode: "standard",
    }),
    snapshot: () => ({ accounts: [], availableOperations: ["target.connection.create.simulator"] }),
    subscribe: () => ({ dispose() {} }),
  };
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: { forOwnConfigurationPresentationService: () => ({}), forOwnPresentationService: () => old },
    pages: {
      register: metadata => {
        pages.set(metadata.id, metadata);
        return () => pages.delete(metadata.id);
      },
    },
    routes: { register: metadata => routes.set(metadata.id, metadata) },
    commands: { register: metadata => commands.set(metadata.id, metadata) },
    managerContent: { replaceProjection: () => () => {} },
    effect: setup => effects.push(setup()),
    slots: { register() {} },
  };
  try {
    apply(ctx);
    assert.deepEqual([...routes.keys()].sort(), ["runtime", "settings"]);
    assert.deepEqual(pages.get("settings").headerActions, []);
    assert.deepEqual([...commands.keys()], []);
  } finally {
    for (const dispose of effects.reverse()) dispose();
  }
});

test("unknown or failing presentation capabilities fail closed while missing v15 preserves older Hosts", async () => {
  const { snapshotOnlyPresentation } = await import("../dist/presentation-capabilities.js");
  assert.equal(snapshotOnlyPresentation({}), false);
  assert.equal(snapshotOnlyPresentation({}, true), true);
  assert.equal(
    snapshotOnlyPresentation({
      presentationCapabilities: () => ({
        contract: "cordisx.channel-manager-presentation-capabilities/v1",
        schemaVersion: 1,
        mode: "standard",
      }),
    }),
    false,
  );
  assert.equal(
    snapshotOnlyPresentation({
      presentationCapabilities: () => ({
        contract: "cordisx.channel-manager-presentation-capabilities/v1",
        schemaVersion: 1,
        mode: "future",
      }),
    }),
    true,
  );
  assert.equal(
    snapshotOnlyPresentation({
      presentationCapabilities() {
        throw new Error("retired");
      },
    }),
    true,
  );
});

test("an explicit standard v15 facade retains the existing settings and creation entrypoints", () => {
  const pages = new Map(), routes = new Map(), commands = new Map(), effects = [];
  const manager = {
    forOwnPresentationService() {
      return this;
    },
    presentationCapabilities: () => ({
      contract: "cordisx.channel-manager-presentation-capabilities/v1",
      schemaVersion: 1,
      mode: "standard",
    }),
    mountSettingsForm() {},
    snapshot: () => ({ accounts: [], availableOperations: ["target.connection.create.simulator"] }),
    subscribe: () => ({ dispose() {} }),
  };
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: manager,
    pages: {
      register: metadata => {
        pages.set(metadata.id, metadata);
        return () => pages.delete(metadata.id);
      },
    },
    routes: {
      register: metadata => {
        routes.set(metadata.id, metadata);
      },
    },
    commands: {
      register: metadata => {
        commands.set(metadata.id, metadata);
      },
    },
    managerContent: { replaceProjection: () => () => {} },
    effect: setup => effects.push(setup()),
    slots: { register() {} },
  };
  try {
    apply(ctx);
    assert.ok(routes.has("create") && routes.has("policy") && routes.has("preferences-defaults"));
    assert.ok(commands.has("open-create") && commands.has("configure-policy"));
    assert.deepEqual(pages.get("settings").headerActions.map(item => item.id), ["policy", "create"]);
  } finally {
    for (const dispose of effects.reverse()) dispose();
  }
});

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
