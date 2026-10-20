import type { PluginServerContext } from "@getpaseo/plugin/server";
import { loadScreenshot } from "./server/screenshots";
import { readScreenshot } from "./shared/screenshots";

export default function contribute(server: PluginServerContext) {
  server.handle(readScreenshot, ({ reference }) => loadScreenshot(reference));
  return () => {};
}
