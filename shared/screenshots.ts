import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const blobReference = z.string().regex(/^blob:sha256:[a-f0-9]{64}$/);
export const imageMimeType = z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const screenshotSchema = z.object({
  caption: z.string(),
  images: z.array(z.object({ data: blobReference, mimeType: imageMimeType })),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rawOutput: z.string(),
});
export type Screenshot = z.output<typeof screenshotSchema>;

export const readScreenshot = defineRpc({
  name: "screenshots.read",
  input: z.object({ reference: blobReference }),
  output: z.object({ base64: z.string(), mimeType: imageMimeType }),
});
