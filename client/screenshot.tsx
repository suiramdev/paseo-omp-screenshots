import type { PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { useRpc } from "@getpaseo/plugin/client";
import { Modal } from "@getpaseo/plugin/client/react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { readScreenshot, type Screenshot } from "../shared/screenshots";

type Props = PluginTimelineItemProps<Screenshot>;

type ImageProps = {
  label: string; theme: Props["theme"]; layout: Props["layout"];
  width?: number; height?: number;
};

function BlobScreenshotImage({ reference, ...props }: ImageProps & { reference: string }) {
  const read = useRpc(readScreenshot);
  const query = useQuery({
    queryKey: ["omp-screenshot", reference],
    queryFn: () => read({ reference }),
    staleTime: Infinity,
    retry: false,
  });
  if (query.isPending) return <Text style={{ color: props.theme.colors.foregroundMuted }}>Loading screenshot…</Text>;
  if (query.isError) return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: props.theme.colors.foreground }}>Screenshot unavailable: {query.error.message}</Text>
      <Pressable accessibilityRole="button" onPress={() => { void query.refetch(); }}>
        <Text style={{ color: props.theme.colors.foreground }}>Retry screenshot</Text>
      </Pressable>
    </View>
  );
  return <ScreenshotPreview {...props} uri={`data:${query.data.mimeType};base64,${query.data.base64}`} />;
}

function ScreenshotPreview({ uri, label, theme, layout, width, height }: ImageProps & { uri: string }) {
  const [expanded, setExpanded] = useState(false);
  const [decodeError, setDecodeError] = useState(false);
  const ratio = width && height ? width / height : 1.6;
  if (decodeError) return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.foreground }}>Screenshot unavailable: Image could not be decoded.</Text>
      <Pressable accessibilityRole="button" onPress={() => setDecodeError(false)}>
        <Text style={{ color: theme.colors.foreground }}>Retry screenshot</Text>
      </Pressable>
    </View>
  );
  const source = { uri };
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${label}`} onPress={() => setExpanded(true)} style={{ width: "100%", maxWidth: 720 }}>
        <Image source={source} accessibilityLabel={label} resizeMode="contain"
          onError={() => setDecodeError(true)}
          style={{ width: "100%", aspectRatio: ratio, maxHeight: layout.compact ? 280 : 420, borderRadius: 8 }} />
      </Pressable>
      <Modal title="Browser screenshot" open={expanded} onOpenChange={setExpanded}>
        <Modal.Content>
          <Image source={source} accessibilityLabel={label} resizeMode="contain" style={{ width: "100%", aspectRatio: ratio }} />
        </Modal.Content>
      </Modal>
    </>
  );
}

function ScreenshotImage({ image, ...props }: ImageProps & { image: Screenshot["images"][number] }) {
  return image.data.startsWith("blob:sha256:")
    ? <BlobScreenshotImage {...props} reference={image.data} />
    : <ScreenshotPreview {...props} uri={`data:${image.mimeType};base64,${image.data}`} />;
}

export function ScreenshotCard({ item, theme, layout }: Props) {
  const [showOutput, setShowOutput] = useState(false);
  return (
    <View style={{ gap: 10, paddingVertical: layout.compact ? 8 : 12 }}>
      <Text style={{ color: theme.colors.foreground }}>{item.data.caption}</Text>
      {item.data.images.map((image, index) => (
        <ScreenshotImage key={index} image={image} label={`Browser screenshot ${index + 1}`} theme={theme} layout={layout} width={item.data.width} height={item.data.height} />
      ))}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showOutput }} onPress={() => setShowOutput(!showOutput)}>
        <Text style={{ color: theme.colors.foregroundMuted }}>{showOutput ? "Hide tool output" : "Show tool output"}</Text>
      </Pressable>
      {showOutput && <ScrollView style={{ maxHeight: 240 }}><Text selectable style={{ color: theme.colors.foregroundMuted, fontFamily: "monospace", fontSize: 12 }}>{item.data.rawOutput}</Text></ScrollView>}
    </View>
  );
}
