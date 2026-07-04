import type { WorkflowNode } from '../../types';
import { defaultContextCompressionTokenLimit, resolveWorkflowNumber } from '../../workflow';
import type { ExecuteContext } from '../types';

export async function executeFixedNumberNode(node: WorkflowNode, context: ExecuteContext) {
  const resolvedValue = resolveWorkflowNumber(
    node.data.fixedNumberValue ?? defaultContextCompressionTokenLimit,
    context.settingsValueDefinitions,
    context.settingsValues,
  );
  if (resolvedValue === undefined) {
    throw new Error(`${node.data.label}: Fixed Number must resolve to one number.`);
  }
  return String(resolvedValue);
}
