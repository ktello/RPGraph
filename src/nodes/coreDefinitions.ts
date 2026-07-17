import type { CoreNodeCreationDefinition, CoreNodeFolderDefinition } from './types';
import { coreNodeLayouts, styleForLayout } from './nodeLayout';
import { coreNodeTypes } from './coreNodeTypes';

// Every node folder exports its complete definition from definition.ts. Discover
// them eagerly — import.meta.glob is resolved by the bundler (and Vitest's Vite
// pipeline), so this runs at module scope, but it only *imports* the modules; the
// definition values are read lazily below.
const definitionModules = import.meta.glob('./*/definition.ts', { eager: true }) as Record<
  string,
  { definition: CoreNodeFolderDefinition }
>;

let cache: CoreNodeCreationDefinition[] | undefined;

// Built lazily on first call so the folders' `definition` exports are never read
// during a module-eval import cycle (definition.ts → workflow barrel →
// persistence → registry/typeIdPolicy → here). Registration order is the
// canonical coreNodeTypes tuple, not the glob's path-alphabetical key order.
export function coreNodeDefinitions(): CoreNodeCreationDefinition[] {
  if (cache) {
    return cache;
  }
  const tupleIndex = new Map<string, number>(coreNodeTypes.map((type, index) => [type, index]));
  cache = Object.values(definitionModules)
    .map((module) => module.definition)
    .sort((a, b) => (tupleIndex.get(a.type) ?? Infinity) - (tupleIndex.get(b.type) ?? Infinity))
    .map(({ persistence, ...definition }) => {
      const layout = coreNodeLayouts[definition.type];
      return {
        ...definition,
        layout,
        // Creation styles come from the layout descriptor, never from create()
        // bodies (manual-mode nodes keep the style their create() provides).
        create: (context) => {
          const node = definition.create(context);
          return { ...node, style: styleForLayout(layout, node.style) };
        },
        saveData: (data) => ({
          ...persistence.saveData(data),
          nodeDataVersion: definition.dataVersion,
        }),
        hydrateData: (data, context) => ({
          ...persistence.hydrateData(data, context),
          nodeDataVersion: definition.dataVersion,
        }),
      };
    });
  return cache;
}
