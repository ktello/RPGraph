import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { contextCompressionMaxTokensHandle } from '../../workflow';
import {
  defaultContextCompressionLengthWords,
  defaultContextCompressionRatio,
  defaultContextCompressionTokenLimit,
} from '../../workflow/defaults';
import { connectionId, preservedData } from '../shared/persistenceHelpers';
import { ContextCompressionNodeCard } from './Card';
import { runContextCompressionNode } from './run';

export const definition: CoreNodeFolderDefinition = {
  type: 'context-compression',
  dataVersion: currentCoreNodeVersions['context-compression'],
  label: 'Context Compression',
  description: 'Summarize text when its context budget is reached',
  menuDescription: 'Summarize text above a token limit',
  paletteGroup: 'LLM & Logic',
  paletteOrder: 4,
  origin: 'core',
  usesLlm: true,
  requiresPreparedInputEdge: true,
  ports: () => [
    input('default', 'text', 'Text Input'),
    input(contextCompressionMaxTokensHandle, 'number', 'Max Tokens'),
    output('default', 'text', 'Text'),
  ],
  Component: ContextCompressionNodeCard,
  execute: runContextCompressionNode,
  create: ({ defaultConnectionId, position, createId }) => ({
    id: createId('context-compression'),
    type: 'workflow',
    position,
    data: {
      label: 'Context Compression',
      description: 'Summarize text when its context budget is reached',
      preview: 'Waiting for text ...',
      nodeType: 'context-compression',
      connectionId: defaultConnectionId,
      contextCompressionMaxTokens: defaultContextCompressionTokenLimit,
      contextCompressionRatio: defaultContextCompressionRatio,
      contextCompressionLengthWords: defaultContextCompressionLengthWords,
      runAfterRpOutput: false,
    },
  }),
  persistence: {
    saveData: (data) => preservedData(data, 'Waiting for text ...', {
      connectionId: data.connectionId,
      contextCompressionMaxTokens: data.contextCompressionMaxTokens,
      contextCompressionRatio: data.contextCompressionRatio,
      contextCompressionLengthWords: data.contextCompressionLengthWords,
      runAfterRpOutput: data.runAfterRpOutput ?? data.compressAfterOutput ?? false,
    }),
    hydrateData: (data, context) => preservedData(data, 'Waiting for text ...', {
      connectionId: connectionId(data, context),
      contextCompressionMaxTokens:
        data.contextCompressionMaxTokens ?? defaultContextCompressionTokenLimit,
      contextCompressionRatio:
        data.contextCompressionRatio ?? defaultContextCompressionRatio,
      contextCompressionLengthWords:
        data.contextCompressionLengthWords ?? defaultContextCompressionLengthWords,
      runAfterRpOutput: data.runAfterRpOutput ?? data.compressAfterOutput ?? false,
    }),
  },
};
