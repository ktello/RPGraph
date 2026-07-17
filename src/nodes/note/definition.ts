import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { NoteNodeCard } from './Card';
import { executeNoteNode } from './execute';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'note',
  dataVersion: currentCoreNodeVersions['note'],
  label: 'Infobox',
  description: 'Markdown info box',
  menuDescription: 'Write formatted Markdown in an info box',
  paletteGroup: 'Text & Values',
  paletteOrder: 0,
  origin: 'core',
  ports: () => [],
  Component: NoteNodeCard,
  execute: executeNoteNode,
  create: ({ position, createId }) => ({
    id: createId('note'),
    type: 'workflow',
    position,
    data: {
      label: 'Infobox',
      description: 'Markdown info box',
      preview: 'Empty note',
      nodeType: 'note',
      noteText: '',
      noteFontSize: 14,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, data.noteText?.trim() ? 'Note written' : 'Empty note', {
      noteText: data.noteText ?? '',
      noteFontSize: data.noteFontSize ?? 14,
    }),
    hydrateData: (data) => preservedData(data, data.noteText?.trim() ? 'Note written' : 'Empty note', {
      noteText: data.noteText ?? '',
      noteFontSize: data.noteFontSize ?? 14,
    }),
  },
};
