import type { WorkflowNode } from '../../types';

export async function executeFixedBoolNode(node: WorkflowNode) {
  return String(node.data.fixedBoolValue ?? false);
}
