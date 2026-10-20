import type { PluginClientContext } from "@getpaseo/plugin/client";
import { ScreenshotCard } from "./client/screenshot";
import { screenshotFromTool } from "./client/transform";
import { screenshotSchema } from "./shared/screenshots";

export default function contribute(client: PluginClientContext) {
  const removeTransformer = client.addTimelineTransformer({
    id: "omp-screenshots",
    query: { itemType: "tool_call" },
    transform({ item }) {
      const data = screenshotFromTool(item);
      if (!data) return;
      return { items: [{ type: "plugin", kind: "screenshot", version: 1, data }] };
    },
  });
  const removeRenderer = client.addTimelineRenderer({ kind: "screenshot", version: 1, schema: screenshotSchema, Component: ScreenshotCard });
  return () => { removeTransformer(); removeRenderer(); };
}
