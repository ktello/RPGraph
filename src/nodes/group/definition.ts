import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { GroupNodeCard } from './Card';
import { executeGroupNode } from './execute';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'group',
  dataVersion: currentCoreNodeVersions['group'],
  label: 'Node Group',
  description: 'Visual workflow group',
  menuDescription: 'Frame and label a group of nodes',
  paletteGroup: 'Text & Values',
  paletteOrder: 1,
  origin: 'core',
  ports: () => [],
  Component: GroupNodeCard,
  execute: executeGroupNode,
  create: ({ position, createId }) => ({
    id: createId('group'),
    type: 'workflow',
    position,
    data: {
      label: 'Node Group',
      description: 'Visual workflow group',
      preview: 'Empty group',
      nodeType: 'group',
      groupTitle: 'Node Group',
    },
  }),
  persistence: {
    saveData: (data) => {
      const title = data.groupTitle?.trim() || data.label || 'Node Group';
      return preservedData(data, 'Group header', {
        label: title,
        groupTitle: title,
      });
    },
    hydrateData: (data) => {
      const title = data.groupTitle?.trim() || data.label || 'Node Group';
      return preservedData(data, 'Group header', {
        label: title,
        groupTitle: title,
      });
    },
  },
};
