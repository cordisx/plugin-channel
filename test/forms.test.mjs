import assert from "node:assert/strict";
import { test } from "node:test";
import { configurationSchema, createSchema } from "../dist/forms.js";

test("keeps invalid names and unavailable platforms out of connection creation", () => {
  const validate = createSchema("zh-CN", ["feishu", "lark"])["~standard"].validate;
  assert.ok(validate({ platform: "simulator", displayName: "Support", groupMode: "all" }).issues);
  assert.ok(validate({ platform: "feishu", displayName: "   ", groupMode: "all" }).issues);
  assert.ok(validate({ platform: "feishu", displayName: "Support", groupMode: "reply-to-everyone" }).issues);
  assert.deepEqual(validate({ platform: "feishu", displayName: "Support", groupMode: "all" }).value, {
    platform: "feishu",
    displayName: "Support",
    groupMode: "all",
  });
});

test("requires a usable configuration name while preserving the typed draft", () => {
  const validate = configurationSchema("en")["~standard"].validate;
  assert.ok(validate({ displayName: "" }).issues);
  assert.ok(validate({ displayName: "\t\n" }).issues);
  assert.deepEqual(validate({ displayName: " Support " }).value, { displayName: " Support " });
});
