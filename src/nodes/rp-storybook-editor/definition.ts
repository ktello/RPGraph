import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { RpStorybookEditorNodeCard } from './Card';
import { executeRpStorybookV1Node } from '../rp-storybook-v1/execute';
import {
  defaultRpStorybookFormattedTextSettings,
  emptyRpStorybookV1,
  parseRpStorybookJson,
  rpStorybookFormattedTextSettings,
  rpStorybookJsonText,
  starterRpStorybookV1,
} from '../rp-storybook-v1/model';
import { preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'rp-storybook-editor',
  dataVersion: currentCoreNodeVersions['rp-storybook-editor'],
  label: 'RP Storybook Editor',
  description: 'Edit storybook text and JSON',
  menuDescription: 'Freely edit storybook formatted text and raw JSON',
  paletteGroup: 'Story Context',
  paletteOrder: 1,
  origin: 'core',
  singleton: false,
  requiresPreparedInputEdge: true,
  ports: () => [
    output('json', 'json', 'JSON'),
    output('formatted-text', 'text', 'Formatted Text'),
    output('character-info', 'text', 'Character Info'),
  ],
  Component: RpStorybookEditorNodeCard,
  // Reuses the RP Storybook node's execute — identical output resolution.
  execute: executeRpStorybookV1Node,
  create: ({ position, createId }) => ({
    id: createId('rp-storybook-editor'),
    type: 'workflow',
    position,
    data: {
      label: 'RP Storybook Editor',
      description: 'Edit storybook text and JSON',
      preview: 'Starter story',
      nodeType: 'rp-storybook-editor',
      storybookJson: rpStorybookJsonText(starterRpStorybookV1),
      storybookStatus: 'Ready',
      storybookFormattedTextSettings: defaultRpStorybookFormattedTextSettings,
    },
  }),
  persistence: {
    saveData: (data) => {
      const storybook = data.storybookJson
        ? parseRpStorybookJson(data.storybookJson)
        : emptyRpStorybookV1;
      return preservedData(data, 'No storybook loaded', {
        storybookJson: rpStorybookJsonText(storybook),
        storybookStatus: storybook.title ? 'Embedded storybook' : 'Ready',
        storybookFormattedTextSettings: rpStorybookFormattedTextSettings(data.storybookFormattedTextSettings),
      });
    },
    hydrateData: (data) => {
      const storybook = data.storybookJson
        ? parseRpStorybookJson(data.storybookJson)
        : emptyRpStorybookV1;
      return preservedData(data, 'No storybook loaded', {
        storybookJson: rpStorybookJsonText(storybook),
        storybookStatus: storybook.title ? 'Loaded embedded storybook' : 'Ready',
        storybookFormattedTextSettings: rpStorybookFormattedTextSettings(data.storybookFormattedTextSettings),
      });
    },
  },
};
