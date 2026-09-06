import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const protocolSchemas = new URL("../node_modules/@cordisx/protocol/schemas/", import.meta.url);

async function protocolValidator(schemaName) {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  for (const name of await readdir(protocolSchemas)) {
    if (!name.endsWith(".schema.json")) continue;
    ajv.addSchema(JSON.parse(await readFile(new URL(name, protocolSchemas), "utf8")));
  }
  const schema = JSON.parse(await readFile(new URL(schemaName, protocolSchemas), "utf8"));
  return ajv.getSchema(schema.$id);
}

test("publishes schema-valid package and runtime manifests with an exact digest", async () => {
  const [packageText, runtimeText] = await Promise.all([
    readFile(new URL("../cordisx-package.json", import.meta.url), "utf8"),
    readFile(new URL("../runtime-manifest.json", import.meta.url), "utf8"),
  ]);
  const packageManifest = JSON.parse(packageText);
  const runtimeManifest = JSON.parse(runtimeText);
  const [validatePackage, validateRuntime] = await Promise.all([
    protocolValidator("plugin-package.v8.schema.json"),
    protocolValidator("plugin-manifest.v8.schema.json"),
  ]);
  assert.equal(validatePackage(packageManifest), true, JSON.stringify(validatePackage.errors));
  assert.equal(validateRuntime(runtimeManifest), true, JSON.stringify(validateRuntime.errors));
  assert.equal(
    packageManifest.runtimeManifest.digest,
    `sha256:${createHash("sha256").update(runtimeText).digest("hex")}`,
  );
});

test("keeps source, runtime manifest, and bundled module identity aligned", async () => {
  const [declared, bundled, packageManifest, npmManifest] = await Promise.all([
    readFile(new URL("../runtime-manifest.json", import.meta.url), "utf8").then(JSON.parse),
    import("../dist/channel.js"),
    readFile(new URL("../cordisx-package.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.deepEqual(bundled.manifest, declared);
  assert.deepEqual(bundled.manifest.services.map(service => service.entry), ["./dist/service.mjs"]);
  assert.equal(packageManifest.id, declared.id);
  assert.equal(packageManifest.version, npmManifest.version);
  await readFile(new URL(`..${packageManifest.entry.slice(1)}`, import.meta.url));
  await readFile(new URL(`..${declared.services[0].entry.slice(1)}`, import.meta.url));
});
