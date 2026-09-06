import assert from "node:assert/strict";
import { test } from "node:test";
import { apply } from "../dist/service.mjs";

const simulator = {
  ref: { adapterId: "simulator", accountId: "local", tenantId: "test" },
  adapterKind: "simulator",
  enabled: true,
  transport: { mode: "simulator" },
};

test("registers only enabled simulator definitions through the public Channel service", async () => {
  const definitions = [];
  const ctx = {
    channel: {
      adapters: {
        register: async definition => {
          definitions.push(definition);
          return { dispose: async () => {} };
        },
      },
    },
  };
  await apply(ctx, {
    contract: "cordisx.channel-service-config/v1",
    schemaVersion: 1,
    connections: [
      simulator,
      { ...simulator, ref: { ...simulator.ref, tenantId: "disabled" }, enabled: false },
      { ...simulator, ref: { ...simulator.ref, tenantId: "feishu" }, adapterKind: "feishu" },
    ],
  });
  assert.equal(definitions.length, 1);
  assert.deepEqual(definitions[0].descriptor.ref, simulator.ref);
  assert.equal(definitions[0].descriptor.secretState, "unavailable");

  const connection = await definitions[0].start({});
  const delivery = {
    deliveryId: "delivery-1",
    target: {
      ...simulator.ref,
      conversationId: "direct-alice",
      kind: "direct",
      threadId: "direct-alice",
      semantics: "conversation",
    },
    kind: "reply",
    text: "Hello",
    createdAt: "2026-09-07T00:00:00.000Z",
  };
  const first = await connection.send(delivery);
  const replay = await connection.send(delivery);
  assert.deepEqual(first, replay);
  assert.equal(first.externalMessageId, "simulated-delivery-1");
  await connection.stop("disposed");
});

test("fails closed on a malformed Host configuration", async () => {
  await assert.rejects(() => apply({ channel: { adapters: { register: async () => ({}) } } }, {}), {
    name: "TypeError",
    message: "Channel service configuration is invalid",
  });
});
