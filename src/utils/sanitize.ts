const dataUrlPattern = /data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-z0-9+/_=-]+)/gi;

function approximateBase64Bytes(base64: string) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.ceil((base64.length * 3) / 4) - padding);
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

export function sanitizeDataUrlsInText(text: string) {
  return text.replace(dataUrlPattern, (_match, mimeType: string, base64: string) => {
    const bytes = approximateBase64Bytes(base64);
    return `[Data URL redacted: ${mimeType}, ~${formatBytes(bytes)}]`;
  });
}

export function sanitizeDataUrls(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') {
    return sanitizeDataUrlsInText(value);
  }
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((entry) => sanitizeDataUrls(entry, seen));
    seen.delete(value);
    return result;
  }
  const result = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      key === 'dataUrl' && typeof entry === 'string'
        ? sanitizeDataUrlsInText(entry)
        : sanitizeDataUrls(entry, seen),
    ]),
  );
  seen.delete(value);
  return result;
}
