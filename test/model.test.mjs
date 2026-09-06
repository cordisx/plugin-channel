import assert from "node:assert/strict";
import { test } from "node:test";
import { accountByToken, bindingsForAccount, operationFence, routeToken, targetFence } from "../dist/model.js";

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
