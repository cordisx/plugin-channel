import assert from "node:assert/strict";
import { test } from "node:test";
import { apply } from "../dist/channel.js";
import { channelSettingsSection, channelSettingsTabs } from "../dist/settings.js";

test("one homepage Settings entry opens four Host tabs with distinct icons and retires its destination", async () => {
  const previousDocument = globalThis.document;
  globalThis.document = { documentElement: { lang: "zh-CN" } };
  const effects = [], projections = [], navigation = [], pages = new Map(), routes = new Map(), commands = new Map();
  let retired = 0, registered;
  const manager = {
    forOwnSettingsService() {
      return this;
    },
    snapshot: () => ({ accounts: [], availableOperations: [] }),
    subscribe: () => ({ dispose() {} }),
    mountSettingsForm() {},
    registerChatCreationSettingsDestination(reference) {
      registered = reference;
      return {
        dispose() {
          retired += 1;
        },
      };
    },
  };
  const ctx = {
    i18n: { define() {} },
    notifications: {},
    channelManager: manager,
    pages: {
      register(metadata) {
        pages.set(metadata.id, metadata);
        return () => pages.delete(metadata.id);
      },
    },
    routes: { register: route => routes.set(route.id, route), navigate: async route => navigation.push(route) },
    commands: { register: (metadata, handler) => commands.set(metadata.id, handler) },
    managerContent: {
      supportedSchemaVersions: [1, 2, 6],
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
    const settings = pages.get("settings").headerActions.filter(action => action.label.key === "settings.title");
    assert.equal(settings.length, 1);
    assert.equal(settings[0].disabled.value, false);
    assert.deepEqual(registered, { id: "preferences-defaults" });
    await commands.get("configure-policy")({ signal: new AbortController().signal });
    assert.deepEqual(navigation, [{ id: "preferences-defaults" }]);
    const declarations = projections.at(-1).declarations.filter(item => item.id.startsWith("preferences-"));
    assert.equal(declarations.length, 4);
    assert.equal(new Set(channelSettingsTabs.map(tab => pages.get(tab.id).icon)).size, 4);
    for (const declaration of declarations) {
      assert.equal(declaration.schemaVersion, 2);
      assert.deepEqual(declaration.header.title, { kind: "route" });
      assert.deepEqual(declaration.parentRoute, { id: "settings" });
      assert.deepEqual(declaration.tabs.map(tab => tab.label.key), channelSettingsTabs.map(tab => tab.title));
      assert.equal(pages.get(declaration.id).title.key, "settings.title");
      assert.equal(routes.get(declaration.id).title.key, "settings.title");
    }
    for (const tab of channelSettingsTabs) assert.equal(channelSettingsSection(`channel:${tab.id}`), tab.segment);
    assert.equal(channelSettingsSection("channel:settings"), undefined);
  } finally {
    for (const dispose of effects.reverse()) dispose();
    globalThis.document = previousDocument;
  }
  assert.equal(retired, 1);
});
