import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { RpStorybookEditorNodeCard } from './Card';
import { executeRpStorybookNode } from '../rp-storybook/execute';
import {
  defaultRpStorybookFormattedTextSettings,
  emptyRpStorybook,
  parseRpStorybookJson,
  rpStorybookFormattedTextSettings,
  rpStorybookJsonText,
  starterRpStorybook,
} from '../rp-storybook/model';
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
  execute: executeRpStorybookNode,
  create: ({ position, createId }) => ({
    id: createId('rp-storybook-editor'),
    type: 'workflow',
    position,
    data: {
      label: 'RP Storybook Editor',
      description: 'Edit storybook text and JSON',
      preview: 'Starter story',
      nodeType: 'rp-storybook-editor',
      storybookJson: rpStorybookJsonText(starterRpStorybook),
      storybookStatus: 'Ready',
      storybookFormattedTextSettings: defaultRpStorybookFormattedTextSettings,
    },
  }),
  persistence: {
    saveData: (data) => {
      const storybook = data.storybookJson
        ? parseRpStorybookJson(data.storybookJson)
        : emptyRpStorybook;
      return preservedData(data, 'No storybook loaded', {
        storybookJson: rpStorybookJsonText(storybook),
        storybookStatus: storybook.title ? 'Embedded storybook' : 'Ready',
        storybookFormattedTextSettings: rpStorybookFormattedTextSettings(data.storybookFormattedTextSettings),
      });
    },
    hydrateData: (data) => {
      const storybook = data.storybookJson
        ? parseRpStorybookJson(data.storybookJson)
        : emptyRpStorybook;
      return preservedData(data, 'No storybook loaded', {
        storybookJson: rpStorybookJsonText(storybook),
        storybookStatus: storybook.title ? 'Loaded embedded storybook' : 'Ready',
        storybookFormattedTextSettings: rpStorybookFormattedTextSettings(data.storybookFormattedTextSettings),
      });
    },
  },
};
