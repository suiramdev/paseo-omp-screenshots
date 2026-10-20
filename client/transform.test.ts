import { test } from "node:test";
import assert from "node:assert/strict";
import { screenshotFromTool } from "./transform";

const reference = `blob:sha256:${"a".repeat(64)}`;
const output = {
  content: [{ type: "text", text: "Captured browser screenshot (2338x1462)." }, { type: "image", data: reference, mimeType: "image/png" }],
  details: { result: { command: "screenshot", width: 2338, height: 1462 } },
};
const item = { name: "browser_screenshot", status: "completed", detail: { type: "unknown", output } };

test("recognizes persisted screenshot results without losing original output", () => {
  const screenshot = screenshotFromTool(item);
  assert.deepEqual(screenshot?.images, [{ data: reference, mimeType: "image/png" }]);
  assert.equal(screenshot?.width, 2338);
  assert.equal(screenshot?.height, 1462);
  assert.deepEqual(JSON.parse(screenshot!.rawOutput), output);
});

test("recognizes embedded base64 screenshots and mixed image results", () => {
  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=";
  const embedded = { type: "image", data: base64, mimeType: "image/png" };
  for (const content of [[output.content[0], embedded], [...output.content, embedded]]) {
    const screenshot = screenshotFromTool({ ...item, detail: { type: "unknown", output: { ...output, content } } });
    assert.deepEqual(screenshot?.images.at(-1), { data: base64, mimeType: "image/png" });
  }
});

test("leaves running, failed, unrelated, missing-image and unsupported-image results untouched", () => {
  for (const candidate of [
    { ...item, status: "running" },
    { ...item, status: "failed" },
    { ...item, name: "other", detail: { type: "unknown", output: { ...output, details: {} } } },
    { ...item, detail: { type: "unknown", output: { content: [output.content[0]] } } },
    { ...item, detail: { type: "unknown", output: { content: [{ type: "image", data: "blob:bad", mimeType: "image/png" }] } } },
    { ...item, detail: { type: "unknown", output: { content: [{ type: "image", data: "not base64!", mimeType: "image/png" }] } } },
  ]) assert.equal(screenshotFromTool(candidate), undefined);
});
