import type { WorkflowNode } from '../../types';
import {
  combineTextInputs,
  combinerInputCount,
  combinerInputHandle,
  combinerPrefixes,
} from '../../workflow';
import type { ExecuteContext } from '../types';

export async function executeCombinerNode(node: WorkflowNode, context: ExecuteContext) {
  const inputCount = combinerInputCount(node.data);
  const incoming = context.edges.filter((edge) => edge.target === node.id);
  const inputEdges = Array.from({ length: inputCount }, (_, index) =>
    incoming.find((edge) => edge.targetHandle === combinerInputHandle(index)),
  );
  if (inputEdges.some((edge) => !edge)) {
    throw new Error(`Text Combiner requires ${inputCount} incoming connections.`);
  }
  const inputValues = await Promise.all(
    inputEdges.map((edge) => context.executeInput(edge!.source, edge!.sourceHandle)),
  );
  const combined = combineTextInputs(combinerPrefixes(node.data), inputValues);
  context.updateRuntimeData(node.id, {
    preview: `Combined ${inputCount} texts`,
    combinerInputPreviews: inputValues,
    fullText: combined,
    displayTokenBytesPerToken: context.textMetrics.bytesPerToken,
  });
  return combined;
}
