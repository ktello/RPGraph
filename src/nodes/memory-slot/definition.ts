import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { nextWireLinkName, wireLinkMode, wireLinkStyle } from './model';
import { MemorySlotNodeCard } from './Card';
import { executeMemorySlotNode } from './execute';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'memory-slot',
  dataVersion: currentCoreNodeVersions['memory-slot'],
  label: 'Wire Link',
  description: 'Store and reuse text through a linked pair',
  menuDescription: 'Store and reuse text through a linked pair',
  paletteGroup: 'Text & Values',
  paletteOrder: 4,
  origin: 'core',
  requiresPreparedInputEdge: true,
  hydrateStyle: (node) => {
    if (node.data.kind !== undefined || node.data.nodeType !== 'memory-slot') {
      return node.style;
    }
    return { ...node.style, ...wireLinkStyle(wireLinkMode(node.data)) };
  },
  ports: (data) => {
    const mode = wireLinkMode(data);
    return [
      ...(mode === 'output' ? [] : [input('default', 'text', 'Save Text')]),
      ...(mode === 'input' ? [] : [output('default', 'text', 'Stored Text')]),
    ];
  },
  Component: MemorySlotNodeCard,
  execute: executeMemorySlotNode,
  create: ({ position, createId, readNodes }) => ({
    id: createId('memory-slot'),
    type: 'workflow',
    position,
    style: wireLinkStyle('joined'),
    data: {
      label: 'Wire Link',
      description: 'Store and reuse text through a linked pair',
      preview: 'No stored text yet',
      nodeType: 'memory-slot',
      memorySlotName: nextWireLinkName(readNodes()),
      memorySlotText: '',
      memorySlotMode: 'joined',
      fullText: '',
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'No stored text yet', {
      memorySlotName: data.memorySlotName,
      memorySlotText: '',
      memorySlotMode: data.memorySlotMode,
      fullText: '',
    }),
    hydrateData: (data) => preservedData(data, 'No stored text yet', {
      memorySlotName: data.memorySlotName,
      memorySlotText: '',
      memorySlotMode: data.memorySlotMode,
      fullText: '',
    }),
  },
};
