import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import {
  combinerInputCount,
  combinerInputHandle,
  minimumCombinerInputs,
} from '../../workflow';
import { combinerPrefixes } from '../../workflow/nodeHelpers';
import { CombinerNodeCard } from './Card';
import { executeCombinerNode } from './execute';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'combiner',
  dataVersion: currentCoreNodeVersions['combiner'],
  label: 'Text Combiner',
  description: 'Merge ordered text inputs',
  menuDescription: 'Merge ordered text inputs',
  paletteGroup: 'Text & Values',
  paletteOrder: 2,
  textDialogSource: 'fullText',
  origin: 'core',
  ports: (data) => [
    ...Array.from({ length: combinerInputCount(data) }, (_, index) =>
      input(combinerInputHandle(index), 'text', `Input ${index + 1}`),
    ),
    output('default', 'text', 'Text'),
  ],
  Component: CombinerNodeCard,
  execute: executeCombinerNode,
  create: ({ position, createId }) => ({
    id: createId('text-combiner'),
    type: 'workflow',
    position,
    data: {
      label: 'Text Combiner',
      description: 'Merge ordered text inputs',
      preview: 'Waiting for 2 inputs ...',
      nodeType: 'combiner',
      combinerInputCount: minimumCombinerInputs,
      combinerPrefixes: ['', ''],
      combinerInputPreviews: ['', ''],
    },
  }),
  persistence: {
    saveData: (data) => {
      const count = combinerInputCount(data);
      return preservedData(data, `Waiting for ${count} inputs ...`, {
        combinerInputCount: count,
        combinerPrefixes: combinerPrefixes(data),
      });
    },
    hydrateData: (data) => {
      const count = combinerInputCount(data);
      return preservedData(data, `Waiting for ${count} inputs ...`, {
        description: 'Merge ordered text inputs',
        combinerInputCount: count,
        combinerPrefixes: combinerPrefixes(data),
      });
    },
  },
};
