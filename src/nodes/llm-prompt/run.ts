import type { WorkflowNode } from '../../types';
import { collectRecentReferenceImages } from '../../chat/referenceImages';
import { resolveTextAndImageInputs } from '../shared/imageInputs';
import type { ExecuteContext } from '../types';
import { executeLlmPromptNode } from './execute';

export async function runLlmPromptNode(node: WorkflowNode, context: ExecuteContext) {
  const { inputValue, images } = await resolveTextAndImageInputs(node, context);
  const referenceImages = collectRecentReferenceImages({
    messages: context.historyMessages,
    nodes: context.nodes,
    options: context.referenceImages,
  });
  const streamsVisibleOutput = !!context.streamOutput && context.edges.some(
    (edge) => edge.source === node.id && edge.target === context.outputNodeId,
  );
  return executeLlmPromptNode({
    node,
    inputValue,
    images,
    referenceImages,
    context,
    streamsVisibleOutput,
  });
}
