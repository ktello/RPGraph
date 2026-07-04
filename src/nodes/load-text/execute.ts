import type { WorkflowNode } from '../../types';

export async function executeLoadTextNode(node: WorkflowNode) {
  return node.data.loadedText ?? '';
}
