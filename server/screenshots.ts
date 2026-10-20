import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { blobReference } from "../shared/screenshots";

const MAX_BYTES = 8 * 1024 * 1024;

export async function loadScreenshot(reference: string) {
  const hash = blobReference.parse(reference).slice("blob:sha256:".length);
  const directory = process.env.OMP_SCREENSHOTS_BLOB_DIR ?? join(homedir(), ".omp", "agent", "blobs");
  const file = await open(join(directory, hash), "r").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") throw new Error("Screenshot is no longer in the OMP blob store.");
    throw error;
  });
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error("Screenshot exceeds the 8 MiB preview limit or is not a file.");
    const bytes = await file.readFile();
    if (createHash("sha256").update(bytes).digest("hex") !== hash) throw new Error("Screenshot blob failed its SHA-256 integrity check.");
    const mimeType = detectImage(bytes);
    if (!mimeType) throw new Error("Blob is not a supported PNG, JPEG, WebP, or GIF image.");
    return { base64: bytes.toString("base64"), mimeType };
  } finally {
    await file.close();
  }
}

function detectImage(bytes: Buffer): "image/png" | "image/jpeg" | "image/webp" | "image/gif" | undefined {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))) return "image/gif";
}
