import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { CustomNodeCard } from './Card';
import { executeCustomNode } from './execute';
import { customNodeDefinition, defaultCustomNodeDefinition } from './model';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'custom',
  dataVersion: currentCoreNodeVersions['custom'],
  label: 'Custom Node',
  description: 'Assistant-built modular node',
  menuDescription: 'Build a modular node with an assistant',
  paletteGroup: 'LLM & Logic',
  paletteOrder: 0,
  origin: 'core',
  usesLlm: true,
  requiresPostOutputPermission: true,
  ports: (data) => {
    const definition = customNodeDefinition(data.customNodeDefinition);
    return [...definition.inputs, ...definition.outputs];
  },
  Component: CustomNodeCard,
  execute: executeCustomNode,
  create: ({ defaultConnectionId, position, createId }) => ({
    id: createId('custom-node'),
    type: 'workflow',
    position,
    data: {
      label: 'Custom Node',
      description: 'Assistant-built modular node',
      preview: 'Ready for Node Assistant',
      nodeType: 'custom',
      connectionId: defaultConnectionId,
      customNodeDefinition: defaultCustomNodeDefinition(),
      runAfterRpOutput: false,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Ready for Node Assistant', {
      connectionId: data.connectionId,
      customNodeDefinition: customNodeDefinition(data.customNodeDefinition),
      runAfterRpOutput: data.runAfterRpOutput ?? false,
    }),
    hydrateData: (data, context) => preservedData(data, 'Ready for Node Assistant', {
      connectionId: connectionId(data, context),
      customNodeDefinition: customNodeDefinition(data.customNodeDefinition),
      runAfterRpOutput: data.runAfterRpOutput ?? false,
    }),
  },
};
