import { getRegisteredCoreNodes } from './registry';
import type { CoreNodeType, NodeCreationDefinition } from './types';
import type { NodeVersion } from './nodeVersion';

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

// Shared registry→palette projection used by the add-node palette and the Node
// Manager. Computed lazily on first call — registry-derived data must be read
// at call time only, never at module evaluation — then cached, since the
// registry contents are static for the lifetime of the app.
export type CorePaletteItem = {
  type: CoreNodeType;
  version: NodeVersion;
  label: string;
  description: string;
  paletteGroup: string;
  paletteOrder?: number;
  disableable: boolean;
};

let cachedCorePaletteItems: CorePaletteItem[] | undefined;
let cachedGroupedCorePaletteItems: Array<{ title: string; items: CorePaletteItem[] }> | undefined;

export function corePaletteItems(): CorePaletteItem[] {
  if (!cachedCorePaletteItems) {
    cachedCorePaletteItems = getRegisteredCoreNodes().map((definition) => ({
      type: definition.type,
      version: definition.dataVersion,
      label: definition.label,
      description: definition.menuDescription,
      paletteGroup: definition.paletteGroup,
      paletteOrder: definition.paletteOrder,
      disableable: definition.disableable !== false,
    }));
  }
  return cachedCorePaletteItems;
}

export function groupedCorePaletteItems(): Array<{ title: string; items: CorePaletteItem[] }> {
  if (!cachedGroupedCorePaletteItems) {
    cachedGroupedCorePaletteItems = groupedPaletteDefinitions(corePaletteItems());
  }
  return cachedGroupedCorePaletteItems;
}
