import type { WorkflowNode } from '../../types';
import { defaultContextCompressionTokenLimit, textStats, validCompressionTokenLimit } from '../../workflow';

export function contextCompressionCapacitySegments(
  node: WorkflowNode,
  estimatedTokenBytesPerToken: number,
  maxTokensOverride?: number,
) {
  const maxTokens = validCompressionTokenLimit(
    maxTokensOverride ??
      node.data.resolvedContextTokenLimit ??
      node.data.contextCompressionMaxTokens ??
      defaultContextCompressionTokenLimit,
  );
  const replacedTokens = textStats(node.data.compressionSourceText ?? '', estimatedTokenBytesPerToken).tokens;
  const summaryTokens = textStats(node.data.compressedText ?? '', estimatedTokenBytesPerToken).tokens;
  const activeTokens = textStats(node.data.compressionRemainingText ?? '', estimatedTokenBytesPerToken).tokens;
  const replacedPercent = replacedTokens > 0 ? Math.min(78, (replacedTokens / Math.max(maxTokens, 1)) * 100) : 0;
  const availablePercent = 100 - replacedPercent;
  const summaryPercent = Math.min(availablePercent, (summaryTokens / Math.max(maxTokens, 1)) * availablePercent);
  const activePercent = Math.min(
    availablePercent - summaryPercent,
    (activeTokens / Math.max(maxTokens, 1)) * availablePercent,
  );
  const freePercent = Math.max(0, availablePercent - summaryPercent - activePercent);

  return {
    maxTokens,
    replacedTokens,
    summaryTokens,
    activeTokens,
    replacedPercent,
    summaryPercent,
    activePercent,
    freePercent,
  };
}
