import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { LastRpOutputNodeCard } from './Card';
import { executeLastRpOutputNode } from './execute';
import { lastRpOutputPersistence } from './persistence';

export const definition: CoreNodeFolderDefinition = {
  type: 'last-rp-output',
  dataVersion: currentCoreNodeVersions['last-rp-output'],
  label: 'Last RP Output',
  description: 'Latest RP output',
  menuDescription: 'Latest RP output as text',
  paletteGroup: 'Input & Output',
  paletteOrder: 2,
  textDialogSource: 'fullText',
  origin: 'core',
  ports: () => [output('default', 'text', 'Text')],
  Component: LastRpOutputNodeCard,
  execute: executeLastRpOutputNode,
  create: ({ position, createId }) => ({
    id: createId('last-rp-output'),
    type: 'workflow',
    position,
    data: {
      label: 'Last RP Output',
      description: 'Latest RP output',
      preview: 'No RP output yet',
      nodeType: 'last-rp-output',
      fullText: '',
      includeRpDateTime: false,
    },
  }),
  persistence: lastRpOutputPersistence,
};
