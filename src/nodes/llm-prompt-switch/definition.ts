import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import {
  defaultLlmPromptSwitchOutputTitles,
  defaultLlmPromptSwitchPromptAftersByOutput,
  defaultLlmPromptSwitchPromptBeforesByOutput,
  defaultLlmPromptSwitchPromptTitlesByOutput,
  llmPromptSwitchOutputTitles,
  llmPromptSwitchOutputHandle,
} from '../../workflow';
import {
  llmPromptSwitchPromptAftersByOutput,
  llmPromptSwitchPromptBeforesByOutput,
  llmPromptSwitchPromptTitlesByOutput,
  llmPromptSwitchSelectedOutputChannel,
  llmPromptSwitchSelectedPromptSlot,
} from '../../workflow/nodeHelpers';
import { LlmPromptSwitchNodeCard } from './Card';
import {
  executeLlmPromptSwitchNode,
  promptSwitchOutputChannelHandle,
  promptSwitchPromptSlotHandle,
  promptSwitchTextHandle,
} from './execute';
import { promptActionConfigs, promptActionSaveConfigs } from '../shared/promptActions';
import { promptCommandConfigs, promptCommandSaveConfigs } from '../shared/promptCommands';
import { connectionId, preservedData } from '../shared/persistenceHelpers';

export const definition: CoreNodeFolderDefinition = {
  type: 'llm-prompt-switch',
  dataVersion: currentCoreNodeVersions['llm-prompt-switch'],
  label: 'LLM Prompt Switch',
  description: 'Select an LLM prompt by output channel and prompt slot',
  menuDescription: 'Select an LLM prompt from a channel matrix',
  paletteGroup: 'LLM & Logic',
  paletteOrder: 2,
  textDialogSource: 'generatedText',
  origin: 'core',
  usesLlm: true,
  contributesToTokenCalibration: true,
  requiresPostOutputPermission: true,
  requiresPreparedInputEdge: true,
  ports: (data) => [
    input(promptSwitchTextHandle, 'text', 'Text Input'),
    input('image', 'image', 'Image Input'),
    input(promptSwitchOutputChannelHandle, 'number', 'Output Channel'),
    input(promptSwitchPromptSlotHandle, 'number', 'Prompt Slot'),
    ...llmPromptSwitchOutputTitles(data).map((title, index) =>
      output(llmPromptSwitchOutputHandle(index), 'mixed', title.trim() || `Output ${index}`),
    ),
  ],
  Component: LlmPromptSwitchNodeCard,
  execute: executeLlmPromptSwitchNode,
  create: ({ defaultConnectionId, position, createId }) => ({
    id: createId('llm-prompt-switch'),
    type: 'workflow',
    position,
    data: {
      label: 'LLM Prompt Switch',
      description: 'Select an LLM prompt by output channel and prompt slot',
      preview: 'Not run yet',
      nodeType: 'llm-prompt-switch',
      llmPromptSwitchOutputTitles: defaultLlmPromptSwitchOutputTitles(),
      llmPromptSwitchPromptTitlesByOutput: defaultLlmPromptSwitchPromptTitlesByOutput(),
      llmPromptSwitchPromptBeforesByOutput: defaultLlmPromptSwitchPromptBeforesByOutput(),
      llmPromptSwitchPromptAftersByOutput: defaultLlmPromptSwitchPromptAftersByOutput(),
      llmPromptSwitchSelectedOutputChannel: 0,
      llmPromptSwitchSelectedPromptSlot: 0,
      llmPromptSwitchAutoShowPrompt: true,
      llmPromptSwitchAutoFormatJson: true,
      llmPromptActions: [],
      llmPromptCommands: [],
      runAfterRpOutput: false,
      connectionId: defaultConnectionId,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Not run yet', {
      llmPromptSwitchOutputTitles: llmPromptSwitchOutputTitles(data),
      llmPromptSwitchPromptTitlesByOutput: llmPromptSwitchPromptTitlesByOutput(data),
      llmPromptSwitchPromptBeforesByOutput: llmPromptSwitchPromptBeforesByOutput(data),
      llmPromptSwitchPromptAftersByOutput: llmPromptSwitchPromptAftersByOutput(data),
      llmPromptSwitchSelectedOutputChannel: llmPromptSwitchSelectedOutputChannel(data),
      llmPromptSwitchSelectedPromptSlot: llmPromptSwitchSelectedPromptSlot(data),
      llmPromptSwitchAutoShowPrompt: data.llmPromptSwitchAutoShowPrompt ?? true,
      llmPromptSwitchAutoFormatJson: data.llmPromptSwitchAutoFormatJson ?? true,
      llmPromptActions: promptActionSaveConfigs(data.llmPromptActions),
      llmPromptCommands: promptCommandSaveConfigs(data.llmPromptCommands),
      connectionId: data.connectionId,
      runAfterRpOutput: data.runAfterRpOutput ?? false,
    }),
    hydrateData: (data, context) => preservedData(data, 'Not run yet', {
      llmPromptSwitchOutputTitles: llmPromptSwitchOutputTitles(data),
      llmPromptSwitchPromptTitlesByOutput: llmPromptSwitchPromptTitlesByOutput(data),
      llmPromptSwitchPromptBeforesByOutput: llmPromptSwitchPromptBeforesByOutput(data),
      llmPromptSwitchPromptAftersByOutput: llmPromptSwitchPromptAftersByOutput(data),
      llmPromptSwitchSelectedOutputChannel: llmPromptSwitchSelectedOutputChannel(data),
      llmPromptSwitchSelectedPromptSlot: llmPromptSwitchSelectedPromptSlot(data),
      llmPromptSwitchAutoShowPrompt: data.llmPromptSwitchAutoShowPrompt ?? true,
      llmPromptSwitchAutoFormatJson: data.llmPromptSwitchAutoFormatJson ?? true,
      llmPromptActions: promptActionConfigs(data.llmPromptActions),
      llmPromptCommands: promptCommandConfigs(data.llmPromptCommands),
      connectionId: connectionId(data, context),
      runAfterRpOutput: data.runAfterRpOutput ?? false,
    }),
  },
};
