import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { PhoneAppsNodeCard } from './Card';
import { executePhoneAppsNode } from './execute';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'phone-apps',
  dataVersion: currentCoreNodeVersions['phone-apps'],
  label: 'Phone Apps',
  description: 'Providers for direct phone apps',
  menuDescription: 'Select LLM providers for phone apps',
  paletteGroup: 'LLM & Logic',
  paletteOrder: 7,
  origin: 'core',
  singleton: true,
  usesLlm: true,
  ports: () => [],
  Component: PhoneAppsNodeCard,
  execute: executePhoneAppsNode,
  create: ({ defaultConnectionId, position }) => ({
    id: 'phone-apps',
    type: 'workflow',
    position,
    data: {
      label: 'Phone Apps',
      description: 'Providers for direct phone apps',
      preview: 'Used directly by phone apps',
      nodeType: 'phone-apps',
      connectionId: defaultConnectionId,
      phoneAppsNotesConnectionId: defaultConnectionId,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Used directly by phone apps', {
      connectionId: data.connectionId,
      phoneAppsNotesConnectionId: data.phoneAppsNotesConnectionId,
    }),
    hydrateData: (data, context) => preservedData(data, 'Used directly by phone apps', {
      connectionId: connectionId(data, context),
      phoneAppsNotesConnectionId:
        data.phoneAppsNotesConnectionId && context.connectionIds.has(data.phoneAppsNotesConnectionId)
          ? data.phoneAppsNotesConnectionId
          : context.defaultConnectionId,
    }),
  },
};
