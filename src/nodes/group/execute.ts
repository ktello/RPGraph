import type { WorkflowNode } from '../../types';

export async function executeGroupNode(node: WorkflowNode) {
  return node.data.groupTitle ?? node.data.label ?? '';
}
