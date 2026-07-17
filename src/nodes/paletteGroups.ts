import type { NodeCreationDefinition } from './types';

// Palette group display order. Definitions whose paletteGroup is not listed
// here (e.g. future plugins) append as new groups after these, alphabetically.
export const nodePaletteGroupOrder = [
  'Input & Output',
  'LLM & Logic',
  'Text & Values',
  'Story Context',
];

const defaultPaletteOrder = 1000;

export function groupedPaletteDefinitions<
  T extends Pick<NodeCreationDefinition, 'paletteGroup' | 'paletteOrder'>,
>(definitions: T[]): Array<{ title: string; items: T[] }> {
  const extraTitles = Array.from(new Set(definitions.map((entry) => entry.paletteGroup)))
    .filter((title) => !nodePaletteGroupOrder.includes(title))
    .sort((a, b) => a.localeCompare(b));
  return [...nodePaletteGroupOrder, ...extraTitles]
    .map((title) => ({
      title,
      items: definitions
        .filter((entry) => entry.paletteGroup === title)
        .sort(
          (a, b) => (a.paletteOrder ?? defaultPaletteOrder) - (b.paletteOrder ?? defaultPaletteOrder),
        ),
    }))
    .filter((group) => group.items.length > 0);
}
