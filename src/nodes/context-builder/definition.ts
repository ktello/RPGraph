import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { contextBuilderInputCount, contextBuilderInputHandle } from '../../workflow';
import { preservedData } from '../shared/persistenceHelpers';
import { ContextBuilderNodeCard } from './Card';
import { executeContextBuilderNode } from './execute';

export const definition: CoreNodeFolderDefinition = {
  type: 'context-builder',
  dataVersion: currentCoreNodeVersions['context-builder'],
  label: 'Context Builder',
  description: 'Select and arrange structured context sections',
  menuDescription: 'Select and arrange structured context',
  paletteGroup: 'Story Context',
  paletteOrder: 2,
  textDialogSource: 'fullText',
  origin: 'core',
  ports: () => [
    ...Array.from({ length: contextBuilderInputCount }, (_, index) =>
      input(contextBuilderInputHandle(index), 'json', `JSON Input ${index + 1}`),
    ),
    output('default', 'text', 'Text'),
  ],
  Component: ContextBuilderNodeCard,
  execute: executeContextBuilderNode,
  create: ({ position, createId }) => ({
    id: createId('context-builder'),
    type: 'workflow',
    position,
    data: {
      label: 'Context Builder',
      description: 'Select and arrange structured context sections',
      preview: 'Connect up to five text inputs, then load',
      nodeType: 'context-builder',
      contextBuilderItems: [],
      contextBuilderStatus: 'Not loaded yet',
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Connect up to five text inputs, then load', {
      contextBuilderItems: data.contextBuilderItems ?? [],
      contextBuilderStatus: 'Loaded from workflow',
    }),
    hydrateData: (data) => preservedData(data, 'Connect up to five text inputs, then load', {
      contextBuilderItems: data.contextBuilderItems ?? [],
      contextBuilderStatus: data.contextBuilderItems?.length ? 'Loaded from workflow' : 'Not loaded yet',
    }),
  },
};
