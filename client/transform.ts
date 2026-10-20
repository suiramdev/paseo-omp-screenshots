import { screenshotSchema, type Screenshot } from "../shared/screenshots";

export function screenshotFromTool(item: {
  name: string;
  status: string;
  detail: { type: string; output?: unknown };
}): Screenshot | undefined {
  if (item.status !== "completed" || item.detail.type !== "unknown") return;
  const output = item.detail.output;
  if (!output || typeof output !== "object") return;
  const result = output as Record<string, unknown>;
  const details = result.details as { result?: { command?: string; width?: number; height?: number } } | undefined;
  if (!item.name.endsWith("browser_screenshot") && details?.result?.command !== "screenshot") return;
  if (!Array.isArray(result.content)) return;
  const images = result.content.filter((block) => block?.type === "image");
  if (images.length === 0) return;
  const parsed = screenshotSchema.safeParse({
    caption: result.content.filter((block) => block?.type === "text" && typeof block.text === "string").map((block) => block.text).join("\n") || "Browser screenshot",
    images,
    width: details?.result?.width,
    height: details?.result?.height,
    rawOutput: JSON.stringify(output, null, 2),
  });
  return parsed.success ? parsed.data : undefined;
}
