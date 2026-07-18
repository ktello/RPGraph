import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { textReplaceEntries, textReplaceReplacementHandle } from '../../workflow/nodeHelpers';
import { preservedData } from '../shared/persistenceHelpers';
import { TextReplaceNodeCard } from './Card';
import { executeTextReplaceNode } from './execute';

export const definition: CoreNodeFolderDefinition = {
  type: 'text-replace',
  dataVersion: currentCoreNodeVersions['text-replace'],
  label: 'Text Replace',
  description: 'Swap source text for replacements',
  menuDescription: 'Find & replace text via a source/replacement map',
  paletteGroup: 'Text & Values',
  paletteOrder: 3,
  textDialogSource: 'fullText',
  origin: 'core',
  ports: (data) => [
    input('default', 'mixed', 'Text / JSON Input'),
    ...textReplaceEntries(data).map((entry, index) =>
      input(textReplaceReplacementHandle(entry.id), 'mixed', `Replacement ${index + 1} Override`),
    ),
    output('text', 'text', 'Text'),
    output('json', 'json', 'JSON'),
  ],
  Component: TextReplaceNodeCard,
  execute: executeTextReplaceNode,
  create: ({ position, createId }) => ({
    id: createId('text-replace'),
    type: 'workflow',
    position,
    data: {
      label: 'Text Replace',
      description: 'Swap source text for replacements',
      preview: 'No replacements configured',
      nodeType: 'text-replace',
      textReplaceEntries: [{ id: 'text-replace-0', source: '', replacement: '' }],
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, data.preview, {
      textReplaceEntries: textReplaceEntries(data),
    }),
    hydrateData: (data) => preservedData(data, data.preview, {
      textReplaceEntries: textReplaceEntries(data),
    }),
  },
};
