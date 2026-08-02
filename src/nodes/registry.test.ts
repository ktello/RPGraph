import { describe, it, expect, vi } from 'vitest';
import { coreNodeTypes } from './coreNodeTypes';
import { getRegisteredCoreNodes } from './registry';
import { groupedPaletteDefinitions, nodePaletteGroupOrder } from './paletteGroups';
import type { NodeCreationDefinition } from './types';

// Discover folder definitions the same way the collector does, so a folder with
// a definition.ts that never reaches the registry (wrong or duplicate type)
// fails here rather than silently.
const folderModules = import.meta.glob('./*/definition.ts', { eager: true }) as Record<
  string,
  { definition: { type: string } }
>;
const folderTypes = Object.values(folderModules).map((module) => module.definition.type);

describe('core node registration', () => {
  it('registers exactly one definition per folder and per tuple entry', () => {
    const registered = getRegisteredCoreNodes().map((definition) => definition.type);
    expect(folderTypes).toHaveLength(coreNodeTypes.length);
    expect(new Set(folderTypes)).toEqual(new Set(coreNodeTypes));
    expect(new Set(registered)).toEqual(new Set(coreNodeTypes));
  });

  it('registers in coreNodeTypes tuple order', () => {
    const registered = getRegisteredCoreNodes().map((definition) => definition.type);
    expect(registered).toEqual([...coreNodeTypes]);
  });

  it('every core definition declares a palette group', () => {
    for (const definition of getRegisteredCoreNodes()) {
      expect(definition.paletteGroup, definition.type).toBeTruthy();
    }
  });

  it('groups every core type exactly once, in group order, sorted by paletteOrder', () => {
    const grouped = groupedPaletteDefinitions(
      getRegisteredCoreNodes().map((definition) => ({
        type: definition.type,
        paletteGroup: definition.paletteGroup,
        paletteOrder: definition.paletteOrder,
      })),
    );

    // Flattened items are a permutation of coreNodeTypes and no group is empty.
    const flattened = grouped.flatMap((group) => group.items.map((item) => item.type));
    expect([...flattened].sort()).toEqual([...coreNodeTypes].sort());
    for (const group of grouped) {
      expect(group.items.length, group.title).toBeGreaterThan(0);
    }

    // Titles listed in nodePaletteGroupOrder keep that relative order; any extra
    // titles append after them, sorted alphabetically.
    const titles = grouped.map((group) => group.title);
    const known = titles.filter((title) => nodePaletteGroupOrder.includes(title));
    const extras = titles.filter((title) => !nodePaletteGroupOrder.includes(title));
    expect(titles).toEqual([...known, ...extras]);
    expect(known).toEqual(nodePaletteGroupOrder.filter((title) => known.includes(title)));
    expect(extras).toEqual([...extras].sort((a, b) => a.localeCompare(b)));

    // Within each group, items are non-decreasing by (paletteOrder ?? 1000).
    for (const group of grouped) {
      const orders = group.items.map((item) => item.paletteOrder ?? 1000);
      for (let index = 1; index < orders.length; index += 1) {
        expect(orders[index], `${group.title}: ${group.items[index].type}`).toBeGreaterThanOrEqual(
          orders[index - 1],
        );
      }
    }
  });

  it('rolls back and re-throws on every lookup when a core definition fails to register', async () => {
    vi.resetModules();
    vi.doMock('./coreDefinitions', () => {
      const dupDef = {
        type: 'test-duplicate',
        dataVersion: '1.0.0',
        origin: 'core',
      } as unknown as NodeCreationDefinition;
      return { coreNodeDefinitions: () => [dupDef, dupDef] };
    });
    try {
      const fresh = await import('./registry');
      expect(() => fresh.getRegisteredNode('anything')).toThrow(/already registered/);
      // The latch stays unset, so the root cause re-surfaces on every later
      // lookup instead of silently reading a half-populated map.
      expect(() => fresh.getRegisteredNode('anything')).toThrow(/already registered/);
    } finally {
      vi.doUnmock('./coreDefinitions');
      vi.resetModules();
    }
  });
});
