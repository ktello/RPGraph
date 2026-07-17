import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { output } from '../portHelpers';
import { HistoryNodeCard } from './Card';
import { executeHistoryNode } from './execute';
import {
  defaultHistoryRpTimePromptSettings,
  historyRpTimePromptSaveSettings,
  historyRpTimePromptSettings,
} from './rpTimePrompt';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'history',
  dataVersion: currentCoreNodeVersions['history'],
  label: 'Chat History',
  description: 'Previous conversation context',
  menuDescription: 'Previous canonical turns',
  paletteGroup: 'Input & Output',
  paletteOrder: 3,
  origin: 'core',
  singleton: true,
  usesLlm: true,
  contributesToTokenCalibration: true,
  requiresPostOutputPermission: true,
  ports: () => [
    output('original', 'text', 'Formatted Chat History'),
    output('last-turns', 'text', 'Last X Turns'),
  ],
  Component: HistoryNodeCard,
  execute: executeHistoryNode,
  create: ({ defaultConnectionId, position, originalHistory, translatedHistory }) => ({
    id: 'chat-history',
    type: 'workflow',
    position,
    data: {
      label: 'Chat History',
      description: 'Previous conversation context',
      preview: 'No conversation yet',
      nodeType: 'history',
      rawHistory: originalHistory,
      originalHistory,
      translatedHistory,
      lastTurnsHistory: originalHistory,
      historyLastTurnsCount: 5,
      connectionId: defaultConnectionId,
      historyTimeTrackingEnabled: false,
      historyTimeStatus: 'RP Time: Disabled',
      historyRpTimePrompt: defaultHistoryRpTimePromptSettings(),
      runAfterRpOutput: true,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'No conversation yet', {
      connectionId: data.connectionId,
      historyTimeTrackingEnabled: data.historyTimeTrackingEnabled ?? false,
      historyTimeStatus: data.historyTimeTrackingEnabled ? 'Waiting for RP time update' : 'RP Time: Disabled',
      historyLastTurnsCount: data.historyLastTurnsCount ?? 5,
      historyRpTimePrompt: historyRpTimePromptSaveSettings(data.historyRpTimePrompt),
      runAfterRpOutput: data.runAfterRpOutput ?? true,
    }),
    hydrateData: (data, context) => preservedData(data, 'No conversation yet', {
      connectionId: connectionId(data, context),
      historyTimeTrackingEnabled: data.historyTimeTrackingEnabled ?? false,
      historyTimeStatus: data.historyTimeTrackingEnabled ? 'Waiting for RP time update' : 'RP Time: Disabled',
      historyLastTurnsCount: data.historyLastTurnsCount ?? 5,
      historyRpTimePrompt: historyRpTimePromptSettings(data.historyRpTimePrompt),
      runAfterRpOutput: data.runAfterRpOutput ?? true,
    }),
  },
};
