import type { WorkflowNode } from '../../types';
import {
  applyTextReplacements,
  textReplaceEntries,
  textReplaceReplacementEntryId,
} from '../../workflow';
import type { ExecuteContext } from '../types';

export async function executeTextReplaceNode(node: WorkflowNode, context: ExecuteContext) {
  const entries = textReplaceEntries(node.data);
  const entryIds = new Set(entries.map((entry) => entry.id));

  // The main Text/JSON input is the default (null) handle — never a per-entry
  // replacement-override handle.
  const inputEdge = context.edges.find(
    (edge) => edge.target === node.id && textReplaceReplacementEntryId(edge.targetHandle) === null,
  );
  const input = inputEdge
    ? await context.executeInput(inputEdge.source, inputEdge.sourceHandle)
    : '';

  // Resolve each connected override, but only for entries that still exist — a
  // dangling replacement:<removedId> edge must never execute its upstream chain.
  const overrides = new Map<string, string>();
  for (const edge of context.edges) {
    if (edge.target !== node.id) {
      continue;
    }
    const entryId = textReplaceReplacementEntryId(edge.targetHandle);
    if (entryId !== null && entryIds.has(entryId)) {
      overrides.set(entryId, await context.executeInput(edge.source, edge.sourceHandle));
    }
  }
  const effectiveEntries = entries.map((entry) =>
    overrides.has(entry.id) ? { ...entry, replacement: overrides.get(entry.id) as string } : entry,
  );

  const result = applyTextReplacements(effectiveEntries, input);
  const activeCount = entries.filter((entry) => entry.source).length;

  context.updateRuntimeData(node.id, {
    preview: activeCount
      ? `Applied ${activeCount} replacement${activeCount === 1 ? '' : 's'}`
      : 'No replacements configured',
    fullText: result,
    displayTokenBytesPerToken: context.textMetrics.bytesPerToken,
  });
  // The same replaced text is returned for both the text and json output handles.
  return result;
}
