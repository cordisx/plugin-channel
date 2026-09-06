import assert from "node:assert/strict";
import { test } from "node:test";
import {
  accountByToken,
  bindingsForAccount,
  createChannelConnection,
  operationFence,
  routeToken,
  targetFence,
} from "../dist/model.js";

const snapshot = {
  contract: "cordisx.channel-runtime-snapshot/v3",
  schemaVersion: 3,
  profileId: "profile-a",
  hostGeneration: "generation-a",
  revision: 7,
  observedAt: "2026-09-07T00:00:00.000Z",
  availableOperations: ["target.connection.create.simulator"],
  accounts: [{
    connectionToken: "chm1_connection",
    adapterKind: "simulator",
    displayName: "Local",
    implementationStatus: "verified",
    connectionState: "ready",
    configurationState: "ready",
    generation: 1,
    lastGoodRevision: 7,
    inbound: { pending: 0, retrying: 0, deadLetter: 0 },
    outbound: { pending: 0, retrying: 0, deadLetter: 0 },
    availableOperations: ["logs.query"],
  }],
  bindings: [{
    bindingToken: "chm1_binding",
    connectionToken: "chm1_connection",
    sessionToken: "chm1_session",
    routeToken: "chm1_route",
    bindingRevision: 2,
    state: "active",
    availableOperations: ["binding.archive"],
  }],
  pendingAuthorizations: [],
};

test("builds every request from the exact current snapshot fence", () => {
  const target = {
    ...targetFence(snapshot),
    operation: "target.connection.create.simulator",
    adapterKind: "simulator",
    target: { kind: "root" },
  };
  const operation = {
    ...operationFence(snapshot),
    operation: "connection.reconnect",
    target: { kind: "connection", connectionToken: "chm1_connection" },
  };

  for (const request of [target, operation]) {
    assert.equal(request.profileId, snapshot.profileId);
    assert.equal(request.hostGeneration, snapshot.hostGeneration);
    assert.equal(request.expectedRevision, snapshot.revision);
    assert.match(request.requestId, /.+/);
  }
});

test("selects only opaque connection-token projections", () => {
  assert.equal(accountByToken(snapshot, "chm1_connection")?.displayName, "Local");
  assert.equal(accountByToken(snapshot, "missing"), undefined);
  assert.deepEqual(bindingsForAccount(snapshot, "chm1_connection"), snapshot.bindings);
  assert.equal(routeToken("chm1_connection"), "chm1_connection");
  assert.equal(routeToken(null), undefined);
});
+test("creates a simulator through issuance and fenced execution", async () => {
  const calls = [];
  const manager = {
    issue: async request => {
      calls.push(request);
      return {
        ...request,
        contract: "cordisx.channel-manager-target-result/v1",
        status: "applied",
        revision: 8,
        code: "ok",
        target: { kind: "connection-draft", connectionDraftToken: "chm1_draft" },
        expiresAt: "2026-09-07T00:01:00.000Z",
      };
    },
    execute: async request => {
      calls.push(request);
      return {
        ...request,
        contract: "cordisx.channel-manager-result/v2",
        status: "applied",
        revision: 9,
        code: "ok",
        connectionToken: "chm1_connection",
      };
    },
  };

  assert.equal(
    await createChannelConnection(manager, snapshot, {
      platform: "simulator",
      displayName: "Local",
      selectors: ["direct"],
    }),
    "applied",
  );
  assert.deepEqual(calls.map(call => call.operation), [
    "target.connection.create.simulator",
    "connection.create",
  ]);
  assert.equal(calls[1].expectedRevision, 8);
});

test("keeps real-adapter credentials inside the Host capture lineage", async () => {
  const calls = [];
  const manager = {
    issue: async request => {
      calls.push(request);
      if (request.operation === "target.credential.capture.create") {
        return {
          ...request,
          contract: "cordisx.channel-manager-target-result/v1",
          status: "applied",
          revision: 8,
          code: "ok",
          target: { kind: "credential-capture", captureToken: "chm1_capture" },
          expiresAt: "2026-09-07T00:01:00.000Z",
        };
      }
      return {
        ...request,
        contract: "cordisx.channel-manager-target-result/v1",
        status: "applied",
        revision: 10,
        code: "ok",
        target: { kind: "connection-draft", connectionDraftToken: "chm1_connection_draft" },
        expiresAt: "2026-09-07T00:01:00.000Z",
      };
    },
    execute: async request => {
      calls.push(request);
      if (request.operation === "credential.capture") {
        return {
          ...request,
          contract: "cordisx.channel-manager-result/v2",
          status: "applied",
          revision: 9,
          code: "ok",
          credentialDraftToken: "chm1_credential_draft",
          expiresAt: "2026-09-07T00:01:00.000Z",
        };
      }
      return {
        ...request,
        contract: "cordisx.channel-manager-result/v2",
        status: "applied",
        revision: 11,
        code: "ok",
        connectionToken: "chm1_connection",
      };
    },
  };

  assert.equal(
    await createChannelConnection(manager, snapshot, {
      platform: "feishu",
      displayName: "Support",
      selectors: ["direct", "group"],
    }),
    "applied",
  );
  assert.deepEqual(calls.map(call => call.operation), [
    "target.credential.capture.create",
    "credential.capture",
    "target.connection.create",
    "connection.create",
  ]);
  assert.equal("secret" in calls[1], false);
  assert.equal(calls[2].expectedRevision, 9);
  assert.equal(calls[3].expectedRevision, 10);
});
