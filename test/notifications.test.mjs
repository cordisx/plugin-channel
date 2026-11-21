import assert from "node:assert/strict";
import { test } from "node:test";
import { notifyResult } from "../dist/notifications.js";

test("configuration failures keep a distinct, actionable notification from later success", () => {
  const messages = [];
  const props = { locale: "zh-CN", notifications: { show: message => messages.push(message) } };
  notifyResult(props, "connection.update", false, "CONFIGURATION_UNAVAILABLE");
  notifyResult(props, "connection.update", true, "APPLIED");
  assert.equal(messages[0].kind, "connection.update.failed");
  assert.match(messages[0].message, /草稿已保留/);
  assert.equal(messages[1].kind, "connection.update.saved");
  assert.notEqual(messages[0].kind, messages[1].kind);
});
