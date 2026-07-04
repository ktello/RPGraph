import { decode } from '@toon-format/toon';
import { isRecord } from './records';

export function stripStructuredResponse(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:toon)?\s*([\s\S]*?)\s*```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export function parseToonObject(text: string) {
  const stripped = stripStructuredResponse(text);
  const emptyArrayObject = stripped.match(/^([A-Za-z_][A-Za-z0-9_]*)\[\]\{\}$/);
  if (emptyArrayObject) {
    return { [emptyArrayObject[1]]: [] };
  }
  const decoded = decode(stripped);
  if (!isRecord(decoded)) {
    throw new Error('The model did not return TOON.');
  }
  return decoded;
}
