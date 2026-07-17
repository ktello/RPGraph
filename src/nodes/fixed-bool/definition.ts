import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { FixedBoolNodeCard } from './Card';
import { executeFixedBoolNode } from './execute';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'fixed-bool',
  dataVersion: currentCoreNodeVersions['fixed-bool'],
  label: 'Fixed Bool',
  description: 'Boolean workflow parameter',
  menuDescription: 'Drive bool node inputs',
  paletteGroup: 'Text & Values',
  paletteOrder: 9,
  origin: 'core',
  ports: () => [output('default', 'boolean', 'Bool')],
  Component: FixedBoolNodeCard,
  execute: executeFixedBoolNode,
  create: ({ position, createId }) => ({
    id: createId('fixed-bool'),
    type: 'workflow',
    position,
    data: {
      label: 'Fixed Bool',
      description: 'Boolean workflow parameter',
      preview: '',
      nodeType: 'fixed-bool',
      fixedBoolValue: false,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, data.preview, {
      fixedBoolValue: data.fixedBoolValue ?? false,
    }),
    hydrateData: (data) => preservedData(data, data.preview, {
      fixedBoolValue: data.fixedBoolValue ?? false,
    }),
  },
};
