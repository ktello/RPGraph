import type { WorkflowNode } from '../../types';

export async function executeNoteNode(node: WorkflowNode) {
  return node.data.noteText ?? '';
}
