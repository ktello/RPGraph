import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { RpStorybookNodeCard } from './Card';
import { executeRpStorybookNode } from './execute';
import {
  defaultRpStorybookFormattedTextSettings,
  emptyRpStorybook,
  parseRpStorybookJson,
  rpStorybookFormattedTextSettings,
  rpStorybookJsonText,
  starterRpStorybook,
} from './model';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'rp-storybook',
  dataVersion: currentCoreNodeVersions['rp-storybook'],
  label: 'RP Storybook V2',
  description: 'Complete roleplay storybook',
  menuDescription: 'Load or create complete roleplay story data',
  paletteGroup: 'Story Context',
  paletteOrder: 0,
  origin: 'core',
  singleton: true,
  usesLlm: true,
  requiresPreparedInputEdge: true,
  ports: () => [
    output('json', 'json', 'JSON'),
    output('formatted-text', 'text', 'Formatted Text'),
    output('character-info', 'text', 'Character Info'),
  ],
  Component: RpStorybookNodeCard,
  execute: executeRpStorybookNode,
  create: ({ defaultConnectionId, position, createId }) => ({
    id: createId('rp-storybook'),
    type: 'workflow',
    position,
    data: {
      label: 'RP Storybook V2',
      description: 'Complete roleplay storybook',
      preview: 'Starter story',
      nodeType: 'rp-storybook',
      connectionId: defaultConnectionId,
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
        connectionId: data.connectionId,
        storybookJson: rpStorybookJsonText(storybook),
        storybookStatus: storybook.title ? 'Embedded storybook' : 'Ready',
        storybookFormattedTextSettings: rpStorybookFormattedTextSettings(data.storybookFormattedTextSettings),
      });
    },
    hydrateData: (data, context) => {
      const storybook = data.storybookJson
        ? parseRpStorybookJson(data.storybookJson)
        : emptyRpStorybook;
      return preservedData(data, 'No storybook loaded', {
        connectionId: connectionId(data, context),
        storybookJson: rpStorybookJsonText(storybook),
        storybookStatus: storybook.title ? 'Loaded embedded storybook' : 'Ready',
        storybookFormattedTextSettings: rpStorybookFormattedTextSettings(data.storybookFormattedTextSettings),
      });
    },
  },
};
