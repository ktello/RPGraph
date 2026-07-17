import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { FixedNumberNodeCard } from './Card';
import { executeFixedNumberNode } from './execute';
import { defaultContextCompressionTokenLimit } from '../../workflow/defaults';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'fixed-number',
  dataVersion: currentCoreNodeVersions['fixed-number'],
  label: 'Fixed Number',
  description: 'Numeric workflow parameter',
  menuDescription: 'Drive numeric node inputs',
  paletteGroup: 'Text & Values',
  paletteOrder: 8,
  origin: 'core',
  ports: () => [output('default', 'number', 'Number')],
  Component: FixedNumberNodeCard,
  execute: executeFixedNumberNode,
  create: ({ position, createId }) => ({
    id: createId('fixed-number'),
    type: 'workflow',
    position,
    data: {
      label: 'Fixed Number',
      description: 'Numeric workflow parameter',
      preview: '',
      nodeType: 'fixed-number',
      fixedNumberValue: defaultContextCompressionTokenLimit,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, data.preview, {
      fixedNumberValue: data.fixedNumberValue ?? defaultContextCompressionTokenLimit,
    }),
    hydrateData: (data) => preservedData(data, data.preview, {
      fixedNumberValue: data.fixedNumberValue ?? defaultContextCompressionTokenLimit,
    }),
  },
};
