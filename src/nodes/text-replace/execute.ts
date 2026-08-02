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

  // Only overrides for entries that still exist may run — a dangling
  // replacement:<removedId> edge must never execute its upstream chain.
  const overrideEdges = context.edges.filter((edge) => {
    if (edge.target !== node.id) {
      return false;
    }
    const entryId = textReplaceReplacementEntryId(edge.targetHandle);
    return entryId !== null && entryIds.has(entryId);
  });

  // The main input and each override are independent — resolve them concurrently.
  const [input, ...overrideValues] = await Promise.all([
    inputEdge ? context.executeInput(inputEdge.source, inputEdge.sourceHandle) : Promise.resolve(''),
    ...overrideEdges.map((edge) => context.executeInput(edge.source, edge.sourceHandle)),
  ]);

  // Build the map in edge order so duplicate edges on one entry keep last-edge-wins semantics.
  const overrides = new Map<string, string>();
  overrideEdges.forEach((edge, index) => {
    overrides.set(
      textReplaceReplacementEntryId(edge.targetHandle) as string,
      overrideValues[index] as string,
    );
  });
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
