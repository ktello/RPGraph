import type { ChatDialogueQuote } from '../types';

export type ExtractedQuote = {
  index: number;
  text: string;
};

export const dialogueColors = [
  '#d59645',
  '#3fa8c5',
  '#c75c9a',
  '#5fae68',
  '#8a73c9',
  '#c65f5f',
  '#c7af45',
  '#3aa091',
  '#7eb9c5',
  '#ad6ec5',
];

export function extractDialogueQuotes(text: string): ExtractedQuote[] {
  const patterns = [
    /"[^"]*"/g,
    /„[^„“”]*[“”]/g,
    /“[^“”]*”/g,
    /«[^«»]*»/g,
    /»[^»«]*«/g,
  ];
  return patterns
    .flatMap((pattern) =>
      Array.from(text.matchAll(pattern), (match) => ({
        index: match.index,
        text: match[0],
      })),
    )
    .sort((left, right) => left.index - right.index)
    .map((quote, index) => ({ ...quote, index }));
}

export function coloredDialogueParts(text: string, dialogue: ChatDialogueQuote[]) {
  let searchFrom = 0;
  const ranges = dialogue
    .map((quote) => {
      const matchStart = text
        .toLocaleLowerCase()
        .indexOf(quote.text.toLocaleLowerCase(), searchFrom);
      if (matchStart < 0) {
        return undefined;
      }
      let start = matchStart;
      let end = matchStart + quote.text.length;
      if (start > 0 && /["“]/.test(text[start - 1])) {
        start -= 1;
      }
      if (end < text.length && /["”]/.test(text[end])) {
        end += 1;
      }
      searchFrom = end;
      return { start, end, quote };
    })
    .filter((range): range is NonNullable<typeof range> => !!range)
    .sort((left, right) => left.start - right.start)
    .filter((range, index, ranges) => index === 0 || range.start >= ranges[index - 1].end);

  if (ranges.length === 0) {
    return [{ text }];
  }

  const parts: Array<{ text: string; speakerName?: string }> = [];
  let cursor = 0;
  ranges.forEach((range) => {
    if (range.start > cursor) {
      parts.push({ text: text.slice(cursor, range.start) });
    }
    parts.push({ text: text.slice(range.start, range.end), speakerName: range.quote.speakerName });
    cursor = range.end;
  });
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor) });
  }
  return parts;
}

export function quotedSpeechParts(text: string) {
  const matches = [...text.matchAll(/"[^"\n]+(?:"|$)|„[^“”\n]+(?:[“”]|$)|“[^”\n]+(?:”|$)/g)];
  if (matches.length === 0) {
    return [{ text }];
  }

  const parts: Array<{ text: string; isSpeech?: boolean }> = [];
  let cursor = 0;
  matches.forEach((match) => {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start) });
    }
    parts.push({ text: text.slice(start, end), isSpeech: true });
    cursor = end;
  });
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor) });
  }
  return parts;
}

export function thoughtParts(text: string) {
  const matches = [...text.matchAll(/\*[^*\n]+?\*/g)];
  if (matches.length === 0) {
    return [{ text }];
  }

  const parts: Array<{ text: string; isThought?: boolean }> = [];
  let cursor = 0;
  matches.forEach((match) => {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > cursor) {
      parts.push({ text: text.slice(cursor, start) });
    }
    parts.push({ text: text.slice(start, end), isThought: true });
    cursor = end;
  });
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor) });
  }
  return parts;
}

export function thoughtStyleClass(style: 'bold' | 'italic' | 'light') {
  return `thought-text ${style}`;
}
