import type { WorkflowNode } from '../../types';
import { settingsValueEntries, settingsValueHandle } from '../../workflow';
import type { ExecuteContext } from '../types';

export async function executeSettingsValueNode(node: WorkflowNode, context: ExecuteContext) {
  const entries = settingsValueEntries(node.data);
  const entry =
    entries.find((candidate) => settingsValueHandle(candidate.id) === context.sourceHandle) ??
    entries[0];
  return String(context.settingsValues[entry.optionKey] ?? 0);
}
