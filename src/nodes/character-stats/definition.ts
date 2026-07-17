import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { CharacterStatsNodeCard } from './Card';
import { runCharacterStatsNode } from './run';
import { defaultCharacterStatDefinitions, defaultCharacterStatsMaxChange } from '../../workflow';
import { characterStatDefinitions, characterStatsMaxChange } from '../../workflow/nodeHelpers';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'character-stats',
  dataVersion: currentCoreNodeVersions['character-stats'],
  label: 'Character Stats Tracker',
  description: 'Track character stats',
  menuDescription: 'Track character stats',
  paletteGroup: 'LLM & Logic',
  paletteOrder: 6,
  textDialogSource: 'fullText',
  origin: 'core',
  usesLlm: true,
  contributesToTokenCalibration: true,
  requiresPostOutputPermission: true,
  requiresPreparedInputEdge: true,
  ports: () => [
    input('initial-context', 'text', 'Initial Context'),
    input('last-message', 'text', 'Last Message'),
    output('default', 'text', 'Stats State'),
    output('context', 'text', 'Context + Stats'),
  ],
  Component: CharacterStatsNodeCard,
  execute: runCharacterStatsNode,
  create: ({ defaultConnectionId, position, createId }) => ({
    id: createId('character-stats'),
    type: 'workflow',
    position,
    data: {
      label: 'Character Stats Tracker',
      description: 'Track character stats',
      preview: 'Waiting for automatic initialization',
      nodeType: 'character-stats',
      connectionId: defaultConnectionId,
      characterStatDefinitions: defaultCharacterStatDefinitions,
      characterStatsMaxChange: defaultCharacterStatsMaxChange,
      characterStatsStatus: 'Initializes from connected context',
      runAfterRpOutput: true,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Waiting for automatic initialization', {
      connectionId: data.connectionId,
      characterStatDefinitions: characterStatDefinitions(data),
      characterStatsMaxChange: characterStatsMaxChange(data),
      characterStatsStatus: 'Initializes from connected context',
      characterStatsPrimaryId: data.characterStatsPrimaryId,
      runAfterRpOutput: data.runAfterRpOutput ?? true,
    }),
    hydrateData: (data, context) => preservedData(data, 'Waiting for automatic initialization', {
      connectionId: connectionId(data, context),
      characterStatDefinitions: characterStatDefinitions(data),
      characterStatsMaxChange: characterStatsMaxChange(data),
      characterStatsStatus: 'Initializes from connected context',
      characterStatsPrimaryId: data.characterStatsPrimaryId,
      runAfterRpOutput: data.runAfterRpOutput ?? true,
    }),
  },
};
