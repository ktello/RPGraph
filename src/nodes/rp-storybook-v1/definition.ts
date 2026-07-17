import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { RpStorybookV1NodeCard } from './Card';
import { executeRpStorybookV1Node } from './execute';
import {
  defaultRpStorybookFormattedTextSettings,
  emptyRpStorybookV1,
  parseRpStorybookJson,
  rpStorybookFormattedTextSettings,
  rpStorybookJsonText,
  starterRpStorybookV1,
} from './model';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'rp-storybook-v1',
  dataVersion: currentCoreNodeVersions['rp-storybook-v1'],
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
  Component: RpStorybookV1NodeCard,
  execute: executeRpStorybookV1Node,
  create: ({ defaultConnectionId, position, createId }) => ({
    id: createId('rp-storybook-v1'),
    type: 'workflow',
    position,
    data: {
      label: 'RP Storybook V2',
      description: 'Complete roleplay storybook',
      preview: 'Starter story',
      nodeType: 'rp-storybook-v1',
      connectionId: defaultConnectionId,
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
        connectionId: data.connectionId,
        storybookJson: rpStorybookJsonText(storybook),
        storybookStatus: storybook.title ? 'Embedded storybook' : 'Ready',
        storybookFormattedTextSettings: rpStorybookFormattedTextSettings(data.storybookFormattedTextSettings),
      });
    },
    hydrateData: (data, context) => {
      const storybook = data.storybookJson
        ? parseRpStorybookJson(data.storybookJson)
        : emptyRpStorybookV1;
      return preservedData(data, 'No storybook loaded', {
        connectionId: connectionId(data, context),
        storybookJson: rpStorybookJsonText(storybook),
        storybookStatus: storybook.title ? 'Loaded embedded storybook' : 'Ready',
        storybookFormattedTextSettings: rpStorybookFormattedTextSettings(data.storybookFormattedTextSettings),
      });
    },
  },
};
