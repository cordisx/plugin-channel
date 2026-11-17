import assert from "node:assert/strict";
import { test } from "node:test";
import { channelSettingsFormMount } from "../dist/settings-form.js";

test("Channel new-chat tab uses the overlay form while other tabs and older Hosts keep their public form", async () => {
  const calls = [], target = {}, options = { signal: new AbortController().signal };
  const manager = {
    mountSettingsForm(...args) {
      assert.equal(this, manager);
      calls.push(["general", ...args]);
    },
    mountChannelCreationDefaultsForm(...args) {
      assert.equal(this, manager);
      calls.push(["channel", ...args]);
    },
  };
  await channelSettingsFormMount(manager, "new-chats")(target, options);
  await channelSettingsFormMount(manager, "messages")(target, options);
  assert.deepEqual(calls, [["channel", target, options], ["general", "messages", target, options]]);
  const legacyCalls = [];
  const legacy = { mountSettingsForm: (...args) => legacyCalls.push(args) };
  await channelSettingsFormMount(legacy, "new-chats")(target, options);
  assert.deepEqual(legacyCalls, [["new-chats", target, options]]);
  assert.equal(channelSettingsFormMount({}, "new-chats"), undefined);
});
