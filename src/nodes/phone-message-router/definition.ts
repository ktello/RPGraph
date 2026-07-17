import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import {
  textRouterMode,
  textRouterNumberOutputCount,
  textRouterNumberOutputHandle,
} from '../../workflow';
import { PhoneMessageRouterNodeCard } from './Card';
import { executePhoneMessageRouterNode } from './execute';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'phone-message-router',
  dataVersion: currentCoreNodeVersions['phone-message-router'],
  label: 'Text Router',
  description: 'Route text by bool or number',
  menuDescription: 'Split text into bool or numbered paths',
  paletteGroup: 'Text & Values',
  paletteOrder: 5,
  origin: 'core',
  ports: (data) => [
    input('text', 'text', 'Text Input'),
    textRouterMode(data) === 'number'
      ? input('condition', 'number', 'Number')
      : input('condition', 'boolean', 'Bool'),
    ...(textRouterMode(data) === 'number'
      ? Array.from({ length: textRouterNumberOutputCount(data) }, (_, index) =>
          output(textRouterNumberOutputHandle(index), 'text', `Number ${index} Text`),
        )
      : [
          output('false', 'text', 'False Text'),
          output('true', 'text', 'True Text'),
        ]),
  ],
  Component: PhoneMessageRouterNodeCard,
  execute: executePhoneMessageRouterNode,
  create: ({ position, createId }) => ({
    id: createId('phone-message-router'),
    type: 'workflow',
    position,
    data: {
      label: 'Text Router',
      description: 'Route text by bool or number',
      preview: 'Waiting for routed text ...',
      nodeType: 'phone-message-router',
      textRouterMode: 'bool',
      textRouterNumberOutputCount: 5,
      fullText: '',
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Waiting for routed text ...', {
      textRouterMode: textRouterMode(data),
      textRouterNumberOutputCount: textRouterNumberOutputCount(data),
      fullText: '',
    }),
    hydrateData: (data) => preservedData(data, 'Waiting for routed text ...', {
      textRouterMode: textRouterMode(data),
      textRouterNumberOutputCount: textRouterNumberOutputCount(data),
      fullText: '',
    }),
  },
};
