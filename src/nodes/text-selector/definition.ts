import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import {
  textSelectorInputCount,
  textSelectorMode,
  textSelectorTextInputHandle,
} from '../../workflow';
import { TextSelectorNodeCard } from './Card';
import { executeTextSelectorNode } from './execute';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'text-selector',
  dataVersion: currentCoreNodeVersions['text-selector'],
  label: 'Text Selector',
  description: 'Select text by bool or number',
  menuDescription: 'Choose one text input by bool or number',
  paletteGroup: 'Text & Values',
  paletteOrder: 6,
  origin: 'core',
  ports: (data) => [
    textSelectorMode(data) === 'number'
      ? input('condition', 'number', 'Select Number')
      : input('condition', 'boolean', 'Bool'),
    ...(textSelectorMode(data) === 'number'
      ? Array.from({ length: textSelectorInputCount(data) }, (_, index) =>
          input(textSelectorTextInputHandle(index), 'text', `Number ${index} Text`),
        )
      : [
          input('false', 'text', 'False Text'),
          input('true', 'text', 'True Text'),
        ]),
    output('default', 'text', 'Text'),
  ],
  Component: TextSelectorNodeCard,
  execute: executeTextSelectorNode,
  create: ({ position, createId }) => ({
    id: createId('text-selector'),
    type: 'workflow',
    position,
    data: {
      label: 'Text Selector',
      description: 'Select text by bool or number',
      preview: 'Waiting for selected text ...',
      nodeType: 'text-selector',
      textSelectorMode: 'bool',
      textSelectorInputCount: 5,
      fullText: '',
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Waiting for selected text ...', {
      textSelectorMode: textSelectorMode(data),
      textSelectorInputCount: textSelectorInputCount(data),
      fullText: '',
    }),
    hydrateData: (data) => preservedData(data, 'Waiting for selected text ...', {
      textSelectorMode: textSelectorMode(data),
      textSelectorInputCount: textSelectorInputCount(data),
      fullText: '',
    }),
  },
};
