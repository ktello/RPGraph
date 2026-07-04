export function stableEntryId(...parts: Array<string | number | undefined>) {
  return parts
    .filter((part): part is string | number => part !== undefined && part !== '')
    .map((part) => String(part).replace(/[^A-Za-z0-9_-]+/g, '-'))
    .join('-');
}

export function compactJson(value: unknown) {
  return JSON.stringify(value);
}

export function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
