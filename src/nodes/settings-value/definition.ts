import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { SettingsValueNodeCard } from './Card';
import { executeSettingsValueNode } from './execute';
import { settingsValueEntries, settingsValueHandle } from '../../workflow/nodeHelpers';
import { contextLengthMaxOptionKey } from '../../workflow/defaults';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'settings-value',
  dataVersion: currentCoreNodeVersions['settings-value'],
  label: 'Workflow Variable',
  description: 'Output values configured in Options',
  menuDescription: 'Output centrally configured variables',
  paletteGroup: 'Text & Values',
  paletteOrder: 10,
  origin: 'core',
  ports: (data) => settingsValueEntries(data).map((entry) =>
    output(settingsValueHandle(entry.id), 'mixed', entry.label),
  ),
  Component: SettingsValueNodeCard,
  execute: executeSettingsValueNode,
  create: ({ position, createId }) => ({
    id: createId('settings-value'),
    type: 'workflow',
    position,
    data: {
      label: 'Workflow Variable',
      description: 'Output values configured in Options',
      preview: 'Values are edited in Options',
      nodeType: 'settings-value',
      settingsValueEntries: [{
        id: 'context-length-max',
        optionKey: contextLengthMaxOptionKey,
        label: 'Context Length Max',
      }],
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Values are edited in Options', {
      settingsValueEntries: settingsValueEntries(data),
    }),
    hydrateData: (data) => preservedData(data, 'Values are edited in Options', {
      settingsValueEntries: settingsValueEntries(data),
    }),
  },
};
