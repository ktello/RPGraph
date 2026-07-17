import type { CoreNodeFolderDefinition, PortDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { llmDecisionEntries, llmDecisionOutputHandle } from '../../workflow';
import { llmDecisionQuestions, llmDecisionOutputToggles } from '../../workflow/nodeHelpers';
import { connectionId, preservedData } from '../shared/persistenceHelpers';
import { LlmDecisionNodeCard } from './Card';
import { executeLlmDecisionNode } from './execute';

export const definition: CoreNodeFolderDefinition = {
  type: 'llm-decision',
  dataVersion: currentCoreNodeVersions['llm-decision'],
  label: 'LLM Decision',
  description: 'Ask LLM questions and output bool, text and number',
  menuDescription: 'LLM bool/text/number decisions',
  paletteGroup: 'LLM & Logic',
  paletteOrder: 3,
  textDialogSource: 'fullText',
  origin: 'core',
  usesLlm: true,
  contributesToTokenCalibration: true,
  requiresPostOutputPermission: true,
  requiresPreparedInputEdge: true,
  ports: (data) => [
    input('default', 'text', 'Text Input'),
    input('image', 'image', 'Image Input'),
    ...llmDecisionEntries(data).flatMap((entry) =>
      ([
        entry.outputs.bool ? output(llmDecisionOutputHandle(entry.index, 'bool'), 'boolean', `Bool ${entry.index + 1}`) : undefined,
        entry.outputs.text ? output(llmDecisionOutputHandle(entry.index, 'text'), 'text', `Text ${entry.index + 1}`) : undefined,
        entry.outputs.number ? output(llmDecisionOutputHandle(entry.index, 'number'), 'number', `Number ${entry.index + 1}`) : undefined,
      ]).filter((port): port is PortDefinition => !!port),
    ),
  ],
  Component: LlmDecisionNodeCard,
  execute: executeLlmDecisionNode,
  create: ({ defaultConnectionId, position, createId }) => ({
    id: createId('llm-decision'),
    type: 'workflow',
    position,
    data: {
      label: 'LLM Decision',
      description: 'Ask LLM questions and output bool, text and number',
      preview: 'Not run yet',
      nodeType: 'llm-decision',
      connectionId: defaultConnectionId,
      runAfterRpOutput: true,
      llmDecisionQuestions: [''],
      llmDecisionOutputToggles: [{ bool: true, text: true, number: true }],
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Not run yet', {
      connectionId: data.connectionId,
      runAfterRpOutput: data.runAfterRpOutput ?? true,
      llmDecisionQuestions: llmDecisionQuestions(data),
      llmDecisionOutputToggles: llmDecisionOutputToggles(data),
    }),
    hydrateData: (data, context) => preservedData(data, 'Not run yet', {
      connectionId: connectionId(data, context),
      runAfterRpOutput: data.runAfterRpOutput ?? true,
      llmDecisionQuestions: llmDecisionQuestions(data),
      llmDecisionOutputToggles: llmDecisionOutputToggles(data),
    }),
  },
};
