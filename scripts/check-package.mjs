import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const destination = await mkdtemp(join(tmpdir(), "channel-package-"));
try {
  execFileSync("npm", ["pack", "--pack-destination", destination], { stdio: "inherit" });
  const archives = (await readdir(destination)).filter(name => name.endsWith(".tgz"));
  assert.equal(archives.length, 1);
  const archive = join(destination, archives[0]);
  const image = execFileSync("tar", ["-xOf", archive, "package/assets/channel.png"]);
  assert.deepEqual(image, await readFile(new URL("../assets/channel.png", import.meta.url)));
  const module = execFileSync("tar", ["-xOf", archive, "package/dist/channel.js"], { encoding: "utf8" });
  assert.equal(module, await readFile(new URL("../dist/channel.js", import.meta.url), "utf8"));
  console.log("Package contains the exact selected PNG and validated runtime module.");
} finally {
  await rm(destination, { recursive: true, force: true });
}
