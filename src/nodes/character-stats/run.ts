import type { WorkflowNode } from '../../types';
import { characterStatDefinitions, characterStatsStateText, normalizeCharacterStatsState } from '../../workflow';
import { characterStatsMemo } from '../runScratch';
import type { ExecuteContext } from '../types';
import { executeCharacterStatsNode } from './execute';

const initialContextHandle = 'initial-context';
const lastMessageHandle = 'last-message';

async function resolveTextInput(node: WorkflowNode, context: ExecuteContext, targetHandle: string) {
  const edge = context.edges.find(
    (candidate) => candidate.target === node.id && candidate.targetHandle === targetHandle,
  );
  return edge ? context.executeInput(edge.source, edge.sourceHandle) : '';
}

export async function runCharacterStatsNode(node: WorkflowNode, context: ExecuteContext) {
  if (context.phase === 'response' && node.data.runPrepared && node.data.characterStatsState) {
    const state = normalizeCharacterStatsState(context.nodes, node.data.characterStatsState);
    const stateText = characterStatsStateText(
      context.nodes,
      state,
      characterStatDefinitions(node.data),
      node.data.characterStatsBaselineState,
    );
    const contextText = node.data.characterStatsContextText || `${context.lastRpOutput}\n\n${stateText}`;
    return context.sourceHandle === 'context' ? contextText : stateText;
  }

  const memo = characterStatsMemo(context);
  let statsResult = memo.get(node.id);
  if (!statsResult) {
    const [initialContext, lastMessage] = await Promise.all([
      resolveTextInput(node, context, initialContextHandle),
      resolveTextInput(node, context, lastMessageHandle),
    ]);
    statsResult = executeCharacterStatsNode({
      node,
      initialContext,
      lastMessage,
      nodes: context.nodes,
      historyMessages: context.historyMessages,
      llm: context.llm,
      updateRuntimeNode: context.updateRuntimeData,
    });
    memo.set(node.id, statsResult);
  }
  const resolved = await statsResult;
  return context.sourceHandle === 'context' ? resolved.contextText : resolved.stateText;
}
