import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { InputNodeCard } from './Card';
import { executeInputNode } from './execute';
import {
  autoTurnInstructionSaveSettings,
  autoTurnInstructionSettings,
  defaultAutoTurnInstructionSettings,
} from '../../chat/instructions';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'input',
  dataVersion: currentCoreNodeVersions['input'],
  label: 'User Input',
  description: 'Chat message',
  menuDescription: 'Single chat input',
  paletteGroup: 'Input & Output',
  paletteOrder: 0,
  origin: 'core',
  singleton: true,
  disableable: false,
  usesLlm: true,
  ports: () => [
    output('default', 'text', 'Text'),
    output('image', 'image', 'Image'),
    output('message-format', 'number', 'Message Format'),
    output('turn-mode', 'number', 'Turn Mode'),
    output('direct-actions', 'mixed', 'Direct Actions'),
  ],
  Component: InputNodeCard,
  execute: executeInputNode,
  create: ({ defaultConnectionId, position }) => ({
    id: 'user-input',
    type: 'workflow',
    position,
    data: {
      label: 'User Input',
      description: 'Chat message',
      preview: 'Waiting for input ...',
      nodeType: 'input',
      connectionId: defaultConnectionId,
      autoTurnInstructions: defaultAutoTurnInstructionSettings(),
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Waiting for input ...', {
      connectionId: data.connectionId,
      autoTurnInstructions: autoTurnInstructionSaveSettings(data.autoTurnInstructions),
    }),
    hydrateData: (data, context) => preservedData(data, 'Waiting for input ...', {
      connectionId: connectionId(data, context),
      autoTurnInstructions: autoTurnInstructionSettings(data.autoTurnInstructions),
    }),
  },
};
