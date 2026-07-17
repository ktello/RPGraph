import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { LlmPromptNodeCard } from './Card';
import { runLlmPromptNode } from './run';
import { promptActionConfigs, promptActionSaveConfigs } from '../shared/promptActions';
import { promptCommandConfigs, promptCommandSaveConfigs } from '../shared/promptCommands';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'llm-prompt',
  dataVersion: currentCoreNodeVersions['llm-prompt'],
  label: 'LLM Prompt',
  description: 'LLM provider call',
  menuDescription: 'LLM prompt step',
  paletteGroup: 'LLM & Logic',
  paletteOrder: 1,
  textDialogSource: 'generatedText',
  origin: 'core',
  usesLlm: true,
  contributesToTokenCalibration: true,
  requiresPostOutputPermission: true,
  requiresPreparedInputEdge: true,
  ports: () => [
    input('default', 'text', 'Text Input'),
    input('image', 'image', 'Image Input'),
    input('prompt-before', 'mixed', 'Prompt Before Override'),
    input('prompt-after', 'mixed', 'Prompt After Override'),
    output('default', 'mixed', 'Text'),
  ],
  Component: LlmPromptNodeCard,
  execute: runLlmPromptNode,
  create: ({ defaultConnectionId, position, createId }) => ({
    id: createId('llm-prompt'),
    type: 'workflow',
    position,
    data: {
      label: 'LLM Prompt',
      description: 'LLM provider call',
      preview: 'Not run yet',
      nodeType: 'llm-prompt',
      llmPromptBefore: '',
      llmPromptAfter: '',
      llmPromptAutoFormatJson: true,
      llmPromptActions: [],
      llmPromptCommands: [],
      runAfterRpOutput: false,
      connectionId: defaultConnectionId,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Not run yet', {
      llmPromptBefore: data.llmPromptBefore,
      llmPromptAfter: data.llmPromptAfter,
      llmPromptAutoFormatJson: data.llmPromptAutoFormatJson ?? true,
      llmPromptActions: promptActionSaveConfigs(data.llmPromptActions),
      llmPromptCommands: promptCommandSaveConfigs(data.llmPromptCommands),
      connectionId: data.connectionId,
      runAfterRpOutput: data.runAfterRpOutput ?? false,
    }),
    hydrateData: (data, context) => preservedData(data, 'Not run yet', {
      llmPromptBefore: data.llmPromptBefore,
      llmPromptAfter: data.llmPromptAfter,
      llmPromptAutoFormatJson: data.llmPromptAutoFormatJson ?? true,
      llmPromptActions: promptActionConfigs(data.llmPromptActions),
      llmPromptCommands: promptCommandConfigs(data.llmPromptCommands),
      connectionId: connectionId(data, context),
      runAfterRpOutput: data.runAfterRpOutput ?? false,
    }),
  },
};
