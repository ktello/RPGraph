import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { EventManagerNodeCard } from './Card';
import { executeEventManagerNode } from './execute';
import {
  defaultEventManagerPromptSettings,
  eventManagerPromptSaveSettings,
  eventManagerPromptSettings,
} from './prompt';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'event-manager',
  dataVersion: currentCoreNodeVersions['event-manager'],
  label: 'Event Manager',
  description: 'Scheduled event tracking and context',
  menuDescription: 'Track and run scheduled roleplay events',
  paletteGroup: 'LLM & Logic',
  paletteOrder: 5,
  origin: 'core',
  singleton: true,
  usesLlm: true,
  contributesToTokenCalibration: true,
  requiresPostOutputPermission: true,
  ports: () => [
    input('default', 'text', 'Event Context'),
    output('appointments', 'text', 'Events'),
  ],
  Component: EventManagerNodeCard,
  execute: executeEventManagerNode,
  create: ({ defaultConnectionId, position }) => ({
    id: 'event-manager',
    type: 'workflow',
    position,
    data: {
      label: 'Event Manager',
      description: 'Scheduled event tracking and context',
      preview: 'No event context connected',
      nodeType: 'event-manager',
      fullText: '',
      connectionId: defaultConnectionId,
      eventStatus: 'Waiting for event update',
      eventManagerPrompt: defaultEventManagerPromptSettings(),
      runAfterRpOutput: true,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'No event context connected', {
      connectionId: data.connectionId,
      eventStatus: 'Waiting for event update',
      eventManagerPrompt: eventManagerPromptSaveSettings(data.eventManagerPrompt),
      runAfterRpOutput: data.runAfterRpOutput ?? true,
    }),
    hydrateData: (data, context) => preservedData(data, 'No event context connected', {
      connectionId: connectionId(data, context),
      eventStatus: 'Waiting for event update',
      eventManagerPrompt: eventManagerPromptSettings(data.eventManagerPrompt),
      runAfterRpOutput: data.runAfterRpOutput ?? true,
    }),
  },
};
