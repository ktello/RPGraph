import type { WorkflowNode } from '../../types';
import { contextBuilderText } from '../../workflow';

export async function executeContextBuilderNode(node: WorkflowNode) {
  return contextBuilderText(node.data.contextBuilderItems);
}
