import { isRecord } from '../utils/records';

export type ParsedRpOutput = {
  story: string;
  imageDescription?: string;
};

function trailingRpImageMetadata(value: string) {
  const text = value.trimEnd();
  if (!text.endsWith('}')) {
    return undefined;
  }
  for (let start = text.lastIndexOf('{'); start >= 0; start = text.lastIndexOf('{', start - 1)) {
    try {
      const metadata = JSON.parse(text.slice(start)) as unknown;
      if (
        isRecord(metadata) &&
        typeof metadata.image === 'string' &&
        metadata.image.trim()
      ) {
        return {
          imageDescription: metadata.image.trim(),
          story: text.slice(0, start).trim(),
        };
      }
    } catch {
      // Try the previous opening brace. The story may contain other JSON objects.
    }
  }
  return undefined;
}

export function parseRpOutput(value: string): ParsedRpOutput {
  const text = value.trim();
  const trailingMetadata = trailingRpImageMetadata(text);
  if (trailingMetadata) {
    return trailingMetadata;
  }
  const jsonMatch = text.match(
    /^(\{[^\r\n]*\})[ \t]*\r?\n(?:[ \t]*\r?\n)?([\s\S]+)$/,
  );
  if (jsonMatch) {
    try {
      const metadata = JSON.parse(jsonMatch[1]) as unknown;
      if (
        isRecord(metadata) &&
        typeof metadata.image === 'string' &&
        metadata.image.trim()
      ) {
        return {
          imageDescription: metadata.image.trim(),
          story: jsonMatch[2].trim(),
        };
      }
    } catch {
      // Fall through so malformed metadata remains visible instead of being silently discarded.
    }
  }
  const legacyMatch = text.match(
    /^image\s*:\s*"([^"]*)"[ \t]*\r?\n(?:[ \t]*\r?\n)?([\s\S]+)$/i,
  );
  if (!legacyMatch) {
    return { story: text };
  }
  return {
    imageDescription: legacyMatch[1].trim() || undefined,
    story: legacyMatch[2].trim(),
  };
}

function couldBecomeJsonRpImageMetadataBlock(value: string) {
  const text = value.trimStart();
  return (
    /^\{\s*(?:"(?:i(?:m(?:a(?:g(?:e)?)?)?)?)?)?$/i.test(text) ||
    /^\{\s*"image"\s*(?::\s*(?:"[^"]*)?)?$/i.test(text) ||
    /^\{\s*"image"\s*:\s*"[^"]*"\s*$/i.test(text)
  );
}

function isRpImageMetadataLine(value: string) {
  try {
    const metadata = JSON.parse(value) as unknown;
    if (
      isRecord(metadata) &&
      typeof metadata.image === 'string' &&
      metadata.image.trim()
    ) {
      return true;
    }
  } catch {
    // Keep accepting the earlier text format so existing workflows continue to stream cleanly.
  }
  return /^image\s*:\s*"[^"]*"[ \t]*$/i.test(value);
}

function couldBecomeLegacyRpImageMetadataLine(value: string) {
  const normalized = value.trimStart().toLocaleLowerCase();
  if ('image'.startsWith(normalized)) {
    return true;
  }
  if (!normalized.startsWith('image')) {
    return false;
  }
  const afterLabel = normalized.slice('image'.length).trimStart();
  if (!afterLabel.startsWith(':')) {
    return !afterLabel;
  }
  const afterColon = afterLabel.slice(1).trimStart();
  if (!afterColon.startsWith('"')) {
    return !afterColon;
  }
  const afterOpeningQuote = afterColon.slice(1);
  const closingQuoteIndex = afterOpeningQuote.indexOf('"');
  return closingQuoteIndex < 0 || !afterOpeningQuote.slice(closingQuoteIndex + 1).trim();
}

export function createRpImageOutputStream(onStoryChunk: (text: string) => void) {
  let mode: 'detecting' | 'metadata' | 'story' = 'detecting';
  let metadataLineEnd = 0;

  return (value: string) => {
    const text = value.trimStart();
    if (!text) {
      return;
    }
    if (mode === 'detecting') {
      const lineBreakIndex = text.indexOf('\n');
      if (lineBreakIndex < 0) {
        if (text.startsWith('{') || couldBecomeLegacyRpImageMetadataLine(text)) {
          return;
        }
        mode = 'story';
      } else if (isRpImageMetadataLine(text.slice(0, lineBreakIndex).replace(/\r$/, ''))) {
        mode = 'metadata';
        metadataLineEnd = lineBreakIndex + 1;
      } else {
        mode = 'story';
      }
    }
    const story =
      mode === 'metadata'
        ? text.slice(metadataLineEnd).replace(/^[ \t]*(?:\r?\n)?/, '')
        : text;
    const parsed = parseRpOutput(story);
    const storyWithoutCompleteMetadata = parsed.story;
    const trailingJsonStart = storyWithoutCompleteMetadata.lastIndexOf('\n{');
    const streamedStory =
      trailingJsonStart >= 0 &&
      couldBecomeJsonRpImageMetadataBlock(storyWithoutCompleteMetadata.slice(trailingJsonStart + 1))
        ? storyWithoutCompleteMetadata.slice(0, trailingJsonStart).trimEnd()
        : storyWithoutCompleteMetadata;
    if (streamedStory.trim()) {
      onStoryChunk(streamedStory);
    }
  };
}
