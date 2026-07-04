import type { WorkflowNode } from '../../types';
import type { ExecuteContext } from '../types';
import { executeContextCompressionNode } from './execute';

export async function runContextCompressionNode(node: WorkflowNode, context: ExecuteContext) {
  return executeContextCompressionNode({
    node,
    incoming: context.edges.filter((edge) => edge.target === node.id),
    executeNode: context.executeInput,
    llm: context.llm,
    textMetrics: context.textMetrics,
    estimatedTokenBytesPerToken: context.textMetrics.bytesPerToken,
    settingsValueDefinitions: context.settingsValueDefinitions,
    settingsValues: context.settingsValues,
    postOutputRun: context.phase === 'prepare-next-turn',
    blockPostOutput: context.blockPostOutput,
    updateRuntimeNode: context.updateRuntimeData,
  });
}
