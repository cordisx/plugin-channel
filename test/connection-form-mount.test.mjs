import assert from "node:assert/strict";
import { test } from "node:test";
import { mountConnectionFormWithRetry } from "../dist/connection-form-mount.js";

test("retries transient form admission without retrying rejected permissions", async () => {
  const signal = new AbortController().signal;
  const mounted = { status: "mounted", closed: Promise.resolve(), dispose() {} };
  let calls = 0;
  const result = await mountConnectionFormWithRetry(async () => {
    calls += 1;
    return calls === 1 ? { status: "unavailable", code: "HOST_FORM_UNAVAILABLE" } : mounted;
  }, { signal });
  assert.equal(result, mounted);
  assert.equal(calls, 2);
  calls = 0;
  const denied = await mountConnectionFormWithRetry(async () => {
    calls += 1;
    return { status: "unavailable", code: "PERMISSION_DENIED" };
  }, { signal });
  assert.equal(denied.code, "PERMISSION_DENIED");
  assert.equal(calls, 1);
});

test("a late form mount is disposed after its page is retired", async () => {
  const lifetime = new AbortController();
  let finish, disposed = 0;
  const pending = mountConnectionFormWithRetry(() =>
    new Promise(resolve => {
      finish = resolve;
    }), {
    signal: lifetime.signal,
  });
  lifetime.abort();
  finish({
    status: "mounted",
    closed: Promise.resolve(),
    dispose() {
      disposed += 1;
    },
  });
  assert.equal(await pending, undefined);
  assert.equal(disposed, 1);
});
