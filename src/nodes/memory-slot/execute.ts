import type { WorkflowNode } from '../../types';
import { nodeDependsOnPendingUserInput } from '../../graph/edges';
import { memorySlotValues } from '../runScratch';
import type { ExecuteContext } from '../types';
import { wireLinkMode, wireLinkName } from './model';

function memorySlotName(node: WorkflowNode) {
  return wireLinkName(node.data);
}

function memorySlotKey(node: WorkflowNode) {
  return memorySlotName(node).toLocaleLowerCase();
}

export async function executeMemorySlotNode(node: WorkflowNode, context: ExecuteContext) {
  if (
    context.phase === 'prepare-next-turn' &&
    nodeDependsOnPendingUserInput(node.id, context.nodes, context.edges)
  ) {
    context.blockPostOutput('Wire Link is waiting for the next User Input.');
  }
  const incomingEdge = context.edges.find((edge) => edge.target === node.id);
  const slotValues = memorySlotValues(context);
  const slotName = memorySlotName(node);
  const slotKey = memorySlotKey(node);
  const linkedInputNode = !incomingEdge && wireLinkMode(node.data) === 'output'
    ? context.nodes.find(
        (candidate) =>
          candidate.id !== node.id &&
          candidate.data.nodeType === 'memory-slot' &&
          wireLinkMode(candidate.data) !== 'output' &&
          memorySlotKey(candidate) === slotKey &&
          context.edges.some((edge) => edge.target === candidate.id),
      )
    : undefined;
  const storedText = incomingEdge
    ? await context.executeInput(incomingEdge.source, incomingEdge.sourceHandle)
    : linkedInputNode
      ? await context.executeInput(linkedInputNode.id)
      : slotValues.get(slotKey) ?? node.data.memorySlotText ?? '';
  slotValues.set(slotKey, storedText);
  context.nodes
    .filter(
      (candidate) =>
        candidate.data.nodeType === 'memory-slot' &&
        memorySlotKey(candidate) === slotKey,
    )
    .forEach((candidate) => {
      context.updateRuntimeData(candidate.id, {
        preview: storedText ? `${slotName} stored` : 'No stored text yet',
        fullText: storedText,
        memorySlotText: storedText,
        runActive: false,
        runCompleted: context.phase === 'response',
        runPrepared: context.phase === 'prepare-next-turn',
        displayTokenBytesPerToken: context.textMetrics.bytesPerToken,
      });
    });
  return storedText;
}
