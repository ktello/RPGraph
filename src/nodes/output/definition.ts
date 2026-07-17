import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input } from '../portHelpers';
import { OutputNodeCard } from './Card';
import { executeOutputNode } from './execute';
import {
  defaultOutputSpeakerPromptSettings,
  defaultOutputSpeakerResponseFormat,
  outputSpeakerPromptSaveSettings,
  outputSpeakerPromptSettings,
  outputSpeakerResponseFormat,
} from './speakerPrompt';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'output',
  dataVersion: currentCoreNodeVersions['output'],
  label: 'RP Output',
  description: 'Roleplay response',
  menuDescription: 'Single chat output',
  paletteGroup: 'Input & Output',
  paletteOrder: 4,
  origin: 'core',
  singleton: true,
  disableable: false,
  usesLlm: true,
  ports: () => [
    input('default', 'text', 'Normal RP'),
    input('phone-message', 'text', 'Phone Message'),
    input('social-media', 'mixed', 'Social Media'),
    input('autoplay', 'text', 'Autoplay'),
    input('output-actions', 'mixed', 'Output Actions'),
    input('highlighting-context', 'text', 'Highlighting Context'),
    input('direct-actions', 'mixed', 'Direct Actions'),
  ],
  Component: OutputNodeCard,
  execute: executeOutputNode,
  create: ({ defaultConnectionId, position }) => ({
    id: 'rp-output',
    type: 'workflow',
    position,
    data: {
      label: 'RP Output',
      description: 'Roleplay response',
      preview: 'No output yet',
      nodeType: 'output',
      connectionId: defaultConnectionId,
      streamOutputEnabled: false,
      speakerAnalysisEnabled: false,
      dialogueHighlightEnabled: false,
      outputSpeakerResponseFormat: defaultOutputSpeakerResponseFormat,
      outputSpeakerPrompt: defaultOutputSpeakerPromptSettings(),
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'No output yet', {
      connectionId: data.connectionId,
      streamOutputEnabled: data.streamOutputEnabled ?? false,
      speakerAnalysisEnabled: data.speakerAnalysisEnabled ?? false,
      dialogueHighlightEnabled:
        (data.speakerAnalysisEnabled ?? false) && (data.dialogueHighlightEnabled ?? false),
      outputSpeakerResponseFormat: outputSpeakerResponseFormat(data.outputSpeakerResponseFormat),
      outputSpeakerPrompt: outputSpeakerPromptSaveSettings(data.outputSpeakerPrompt),
    }),
    hydrateData: (data, context) => preservedData(data, 'No output yet', {
      connectionId: connectionId(data, context),
      streamOutputEnabled: data.streamOutputEnabled ?? false,
      speakerAnalysisEnabled: data.speakerAnalysisEnabled ?? false,
      dialogueHighlightEnabled:
        (data.speakerAnalysisEnabled ?? false) && (data.dialogueHighlightEnabled ?? false),
      outputSpeakerResponseFormat: outputSpeakerResponseFormat(data.outputSpeakerResponseFormat),
      outputSpeakerPrompt: outputSpeakerPromptSettings(data.outputSpeakerPrompt),
    }),
  },
};
