import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { preservedData } from '../shared/persistenceHelpers';
import { LoadTextNodeCard } from './Card';
import { executeLoadTextNode } from './execute';

export const definition: CoreNodeFolderDefinition = {
  type: 'load-text',
  dataVersion: currentCoreNodeVersions['load-text'],
  label: 'Load Text',
  description: 'Load a text-based file as workflow input',
  menuDescription: 'Load TXT, JSON and other text files',
  paletteGroup: 'Input & Output',
  paletteOrder: 6,
  textDialogSource: 'loadedText',
  origin: 'core',
  ports: () => [output('default', 'text', 'Text')],
  Component: LoadTextNodeCard,
  execute: executeLoadTextNode,
  create: ({ position, createId }) => ({
    id: createId('load-text'),
    type: 'workflow',
    position,
    data: {
      label: 'Load Text',
      description: 'Load a text-based file as workflow input',
      preview: 'No file loaded',
      nodeType: 'load-text',
      loadedText: '',
      loadTextWrapPreview: true,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, data.preview, {
      loadedText: data.loadedText ?? '',
      loadedFileName: data.loadedFileName,
      loadTextWrapPreview: data.loadTextWrapPreview ?? true,
    }),
    hydrateData: (data) => preservedData(data, data.preview, {
      loadedText: data.loadedText ?? '',
      loadedFileName: data.loadedFileName,
      loadTextWrapPreview: data.loadTextWrapPreview ?? true,
    }),
  },
};
