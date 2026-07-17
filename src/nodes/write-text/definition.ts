import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { preservedData } from '../shared/persistenceHelpers';
import { WriteTextNodeCard } from './Card';
import { executeWriteTextNode } from './execute';

export const definition: CoreNodeFolderDefinition = {
  type: 'write-text',
  dataVersion: currentCoreNodeVersions['write-text'],
  label: 'Write Text',
  description: 'Write reusable text directly in the node',
  menuDescription: 'Write static text as workflow input',
  paletteGroup: 'Text & Values',
  paletteOrder: 7,
  origin: 'core',
  ports: () => [output('default', 'text', 'Text')],
  Component: WriteTextNodeCard,
  execute: executeWriteTextNode,
  create: ({ position, createId }) => ({
    id: createId('write-text'),
    type: 'workflow',
    position,
    data: {
      label: 'Write Text',
      description: 'Write reusable text directly in the node',
      preview: 'No text written',
      nodeType: 'write-text',
      writeTextValue: '',
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, data.writeTextValue ? 'Text ready' : 'No text written', {
      writeTextValue: data.writeTextValue ?? '',
    }),
    hydrateData: (data) => preservedData(data, data.writeTextValue ? 'Text ready' : 'No text written', {
      writeTextValue: data.writeTextValue ?? '',
    }),
  },
};
