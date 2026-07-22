import { describe, it, expect } from 'vitest';
import { coreNodeTypes } from './coreNodeTypes';
import { getRegisteredCoreNodes } from './registry';
import { groupedPaletteDefinitions } from './paletteGroups';

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

  it('derives the exact previous palette groups and item order from definitions', () => {
    const grouped = groupedPaletteDefinitions(
      getRegisteredCoreNodes().map((definition) => ({
        type: definition.type,
        paletteGroup: definition.paletteGroup,
        paletteOrder: definition.paletteOrder,
      })),
    );
    const asTypes = grouped.map((group) => ({
      title: group.title,
      types: group.items.map((item) => item.type),
    }));
    expect(asTypes).toEqual([
      {
        title: 'Input & Output',
        types: ['input', 'last-user-input', 'last-rp-output', 'history', 'output', 'text-preview', 'load-text'],
      },
      {
        title: 'LLM & Logic',
        types: ['custom', 'llm-prompt', 'llm-prompt-switch', 'llm-decision', 'context-compression', 'event-manager', 'character-stats', 'phone-apps'],
      },
      {
        title: 'Text & Values',
        types: ['note', 'group', 'combiner', 'text-replace', 'memory-slot', 'phone-message-router', 'text-selector', 'write-text', 'fixed-number', 'fixed-bool', 'settings-value'],
      },
      {
        title: 'Story Context',
        types: ['rp-storybook', 'rp-storybook-editor', 'context-builder'],
      },
    ]);
  });
});
