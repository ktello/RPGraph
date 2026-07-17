import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { LastUserInputNodeCard } from './Card';
import { executeLastUserInputNode } from './execute';
import { lastUserInputPersistence } from './persistence';

export const definition: CoreNodeFolderDefinition = {
  type: 'last-user-input',
  dataVersion: currentCoreNodeVersions['last-user-input'],
  label: 'Last User Input',
  description: 'Latest user message',
  menuDescription: 'Latest user message as text',
  paletteGroup: 'Input & Output',
  paletteOrder: 1,
  textDialogSource: 'fullText',
  origin: 'core',
  ports: () => [output('default', 'text', 'Text')],
  Component: LastUserInputNodeCard,
  execute: executeLastUserInputNode,
  create: ({ position, createId }) => ({
    id: createId('last-user-input'),
    type: 'workflow',
    position,
    data: {
      label: 'Last User Input',
      description: 'Latest user message',
      preview: 'No user input yet',
      nodeType: 'last-user-input',
      fullText: '',
      includeRpDateTime: false,
    },
  }),
  persistence: lastUserInputPersistence,
};
