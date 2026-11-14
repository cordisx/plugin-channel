import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import Ajv from "ajv/dist/2020.js";
import {
  channelCollectionRegistration,
  ChannelCollectionSource,
  registerChannelCollection,
} from "../dist/manager-collection.js";

const states = ["ready", "starting", "retrying", "disabled", "stopped", "unavailable"];
const accounts = states.map((connectionState, index) => ({
  connectionToken: `chm1_${String(index).padStart(43, "a")}`,
  adapterKind: index % 2 === 0 ? "feishu" : "simulator",
  displayName: index === 0 ? "Straße" : `Connection ${index}`,
  connectionState,
}));
const query = (view = "all", normalized = "strasse") => ({
  $schema:
    "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-collection-query.v1.schema.json",
  contract: "cordisx.manager-collection-query/v1",
  schemaVersion: 1,
  collectionId: "connections",
  queryRevision: 42,
  view,
  search: { input: "ＳＴＲＡＳＳＥ", normalized },
});

function managerFixture(initialAccounts = accounts) {
  const listeners = new Set();
  let current = { revision: 7, accounts: initialAccounts };
  let disposed = 0;
  return {
    manager: {
      snapshot: () => current,
      subscribe: listener => {
        listeners.add(listener);
        return {
          dispose: () => {
            disposed += 1;
            listeners.delete(listener);
          },
        };
      },
    },
    update(next) {
      current = next;
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
    disposed: () => disposed,
  };
}

test("returns complete selected views and echoes the exact Host Unicode search fence", () => {
  const fixture = managerFixture();
  const source = new ChannelCollectionSource(fixture.manager, "zh-CN");
  try {
    const snapshot = source.snapshot(query(), new AbortController().signal);
    // An approximate plugin filter would discard Straße for the Host's strasse query.
    assert.equal(snapshot.items.length, accounts.length);
    assert.equal(snapshot.items[0].title.fallback, "Straße");
    assert.equal(snapshot.items[0].summary.fallback, "飞书 · 已连接");
    assert.equal(snapshot.normalizedSearch, "strasse");
    assert.equal(snapshot.queryRevision, 42);
    assert.deepEqual(snapshot.items[0].route, {
      id: "configuration",
      params: { connectionToken: accounts[0].connectionToken },
    });
    assert.deepEqual(snapshot.items[0].actions, []);
    for (const state of states) {
      const selected = source.snapshot(query(state), new AbortController().signal);
      assert.equal(selected.view, state);
      assert.deepEqual(
        selected.items.map(item => item.id),
        accounts.filter(account => account.connectionState === state).map(account => account.connectionToken),
      );
    }
  } finally {
    source.dispose();
  }
});

test("keeps all bilingual registrations and public snapshots valid against published schemas", async () => {
  const ajv = new Ajv({ strict: false });
  for (
    const name of [
      "ui-common.v1",
      "agent-avatar.v1",
      "navigation-collection-actions.v1",
      "manager-collection-common.v1",
      "manager-collection-registration.v1",
      "manager-collection-snapshot.v1",
    ]
  ) {
    const schema = JSON.parse(
      await readFile(
        new URL(`../node_modules/@cordisx/protocol/schemas/${name}.schema.json`, import.meta.url),
        "utf8",
      ),
    );
    ajv.addSchema(schema);
  }
  const validateRegistration = ajv.getSchema(
    "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-collection-registration.v1.schema.json",
  );
  const validateSnapshot = ajv.getSchema(
    "https://raw.githubusercontent.com/cordisx/cordisx-protocol/main/schemas/manager-collection-snapshot.v1.schema.json",
  );
  for (const locale of ["en", "zh-CN"]) {
    const fixture = managerFixture();
    const source = new ChannelCollectionSource(fixture.manager, locale);
    try {
      const registration = channelCollectionRegistration(locale);
      assert.equal(validateRegistration(registration), true, JSON.stringify(validateRegistration.errors));
      for (const view of registration.views) {
        const snapshot = source.snapshot(query(view.id, ""), new AbortController().signal);
        assert.equal(validateSnapshot(snapshot), true, JSON.stringify(validateSnapshot.errors));
      }
    } finally {
      source.dispose();
    }
  }
});

test("tracks authoritative refreshes and releases the subscription after page disposal", () => {
  const fixture = managerFixture();
  const source = new ChannelCollectionSource(fixture.manager, "en");
  let notifications = 0;
  const unsubscribe = source.subscribe(() => notifications += 1);
  const initial = source.snapshot(query(), new AbortController().signal);
  fixture.update({ revision: 8, accounts: [accounts[1]] });
  const next = source.snapshot(query(), new AbortController().signal);
  assert.ok(next.revision > initial.revision);
  assert.deepEqual(next.items.map(item => item.id), [accounts[1].connectionToken]);
  assert.equal(notifications, 1);
  unsubscribe();
  source.dispose();
  source.dispose();
  fixture.update({ revision: 9, accounts });
  assert.equal(notifications, 1);
  assert.equal(fixture.listenerCount(), 0);
  assert.equal(fixture.disposed(), 1);
  assert.throws(() => source.snapshot(query(), new AbortController().signal), /disposed/);
});

test("cleans failed registrations and idempotently retires a successful page handle", () => {
  const fixture = managerFixture();
  assert.throws(() =>
    registerChannelCollection(
      {
        register() {
          throw new Error("Registration rejected");
        },
      },
      fixture.manager,
      "en",
    ), /Registration rejected/);
  assert.equal(fixture.listenerCount(), 0);
  let handleDisposals = 0;
  const cleanup = registerChannelCollection(
    {
      register(registration) {
        assert.equal(registration.id, "connections");
        return { dispose: () => handleDisposals += 1 };
      },
    },
    fixture.manager,
    "en",
  );
  assert.equal(fixture.listenerCount(), 1);
  cleanup();
  cleanup();
  assert.equal(handleDisposals, 1);
  assert.equal(fixture.disposed(), 2);
  assert.equal(fixture.listenerCount(), 0);
});

test("rejects aborted, mismatched, and oversized queries without truncating connections", () => {
  const fixture = managerFixture();
  const source = new ChannelCollectionSource(fixture.manager, "en");
  try {
    assert.throws(() => source.snapshot(query("unknown"), new AbortController().signal), /does not match/);
    assert.throws(
      () => source.snapshot({ ...query(), collectionId: "other" }, new AbortController().signal),
      /does not match/,
    );
    assert.throws(() => source.snapshot(query(), AbortSignal.abort()));
    fixture.update({
      accounts: Array.from({ length: 1001 }, (_, i) => ({
        ...accounts[0],
        connectionToken: `chm1_connection-${i}`,
      })),
    });
    assert.throws(() => source.snapshot(query(), new AbortController().signal), /snapshot bound/);
  } finally {
    source.dispose();
  }
});
