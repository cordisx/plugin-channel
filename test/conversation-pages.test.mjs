import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

// Exercise the actual bundled page factory through the public Node-side React
// boundary. This fixture verifies routing, not the native renderer's visuals.
const require = createRequire(import.meta.url);
const publicReact = pathToFileURL(require.resolve("cordisx/react")).href;
const react = pathToFileURL(require.resolve("react")).href;
const hooks = registerHooks({
  load(url, context, next) {
    if (url !== publicReact) return next(url, context);
    return {
      format: "module",
      shortCircuit: true,
      source: `export * from ${JSON.stringify(react)};
        export function defineReactPage(component) {
          globalThis.__channelTestPage = component;
          return () => {};
        }`,
    };
  },
});
const { apply } = await import("../dist/channel.js");
hooks.deregister();

test("places each remote conversation beneath its connection and retains two detail tabs", async () => {
  const previousDocument = globalThis.document;
  globalThis.document = { documentElement: { lang: "zh-CN" } };
  const effects = [], projections = [], routes = [], listeners = new Set();
  const snapshot = {
    accounts: [{
      connectionToken: "connection",
      adapterKind: "feishu",
      displayName: "测试机器人",
      connectionState: "ready",
      configurationState: "ready",
      inbound: { pending: 0, retrying: 0, deadLetter: 0 },
      outbound: { pending: 0, retrying: 0, deadLetter: 0 },
    }],
    availableOperations: [],
  };
  const manager = {
    forOwnConversationService() {
      return this;
    },
    snapshot: () => snapshot,
    snapshotWithIdentity: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return { dispose: () => listeners.delete(listener) };
    },
  };
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: manager,
    pages: { register: () => () => {} },
    routes: { register: route => routes.push(route), navigate: async () => {} },
    commands: { register() {} },
    managerContent: {
      supportedSchemaVersions: [6],
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
    const body = globalThis.__channelTestPage({
      routeId: "channel:conversation-messages",
      params: { connectionToken: "connection", conversationToken: "remote-group" },
      localization: { getSnapshot: () => ({ locale: "zh-CN" }) },
    });
    const catalog = body.props.conversations;
    const conversation = {
      connectionToken: "connection",
      conversationToken: "remote-group",
      name: "项目讨论群",
      kind: "group",
      bindingCount: 10001,
      activeBindingCount: 10001,
      receivedCount: 12,
      sentCount: 5,
    };
    catalog.adopt([conversation]);
    const projection = projections.at(-1);
    const children = projection.declarations.filter(item => item.route.params?.conversationToken === "remote-group");
    assert.equal(children.length, 2);
    assert.deepEqual(children.map(item => item.parentRoute), [
      { id: "sessions", params: { connectionToken: "connection" } },
      { id: "sessions", params: { connectionToken: "connection" } },
    ]);
    assert.ok(children.every(item => item.header.title.recordIdParam === "conversationToken"));
    assert.ok(children.every(item => item.tabs.length === 2 && item.recordSummary.metrics[0].value === 10001));
    assert.deepEqual(projection.recordTitles.find(item => item.id === "remote-group").title.params, {
      name: "项目讨论群",
    });
    const route = routes.find(item => item.id === "conversation-messages");
    assert.match(route.path, /:connectionToken\/conversations\/:conversationToken\/messages$/);
    const before = projections.length;
    catalog.adopt([conversation]);
    assert.equal(projections.length, before, "Unchanged display data must not replace the Host navigation");
    catalog.adopt([{ ...conversation, name: "新群名" }]);
    assert.equal(projections.at(-1).recordTitles.find(item => item.id === "remote-group").title.params.name, "新群名");
    catalog.adopt([{ ...conversation, connectionToken: "another-connection", conversationToken: "other" }]);
    catalog.replaceConnection("connection", [{ ...conversation, conversationToken: "renewed" }]);
    assert.deepEqual(catalog.forConnection("connection").map(item => item.conversationToken), ["renewed"]);
    assert.deepEqual(catalog.forConnection("another-connection").map(item => item.conversationToken), ["other"]);
  } finally {
    for (const dispose of effects.reverse()) dispose();
    delete globalThis.__channelTestPage;
    globalThis.document = previousDocument;
  }
  assert.equal(listeners.size, 0);
});
