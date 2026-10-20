import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadScreenshot } from "./screenshots";

let directory: string;
const previousDirectory = process.env.OMP_SCREENSHOTS_BLOB_DIR;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), "omp-screenshot-test-"));
  process.env.OMP_SCREENSHOTS_BLOB_DIR = directory;
});
after(async () => {
  if (previousDirectory === undefined) delete process.env.OMP_SCREENSHOTS_BLOB_DIR;
  else process.env.OMP_SCREENSHOTS_BLOB_DIR = previousDirectory;
  await rm(directory, { recursive: true, force: true });
});
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=", "base64");
const hashOf = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

test("returns the exact image bytes with detected MIME type", async () => {
  const hash = hashOf(png);
  await writeFile(join(directory, hash), png);
  const result = await loadScreenshot(`blob:sha256:${hash}`);
  assert.equal(result.mimeType, "image/png");
  assert.deepEqual(Buffer.from(result.base64, "base64"), png);
});
test("rejects traversal and missing references", async () => {
  await assert.rejects(loadScreenshot("blob:sha256:../../config.json"));
  await assert.rejects(loadScreenshot(`blob:sha256:${"0".repeat(64)}`), /no longer/);
});
test("rejects bytes that do not match the content address", async () => {
  const hash = "1".repeat(64);
  await writeFile(join(directory, hash), png);
  await assert.rejects(loadScreenshot(`blob:sha256:${hash}`), /integrity/);
});
test("rejects non-image blobs and oversized files", async () => {
  for (const [bytes, error] of [[Buffer.from("not an image"), /not a supported/], [Buffer.alloc(8 * 1024 * 1024 + 1), /8 MiB/]] as const) {
    const hash = hashOf(bytes);
    await writeFile(join(directory, hash), bytes);
    await assert.rejects(loadScreenshot(`blob:sha256:${hash}`), error);
  }
});
