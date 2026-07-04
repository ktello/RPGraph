import type { WorkflowNode } from '../../types';
import { parseWorkflowVariableSetCommands, resolveWorkflowVariables } from '../../workflow';
import type { ExecuteContext } from '../types';

export async function executeWriteTextNode(node: WorkflowNode, context: ExecuteContext) {
  const output = resolveWorkflowVariables(
    node.data.writeTextValue ?? '',
    context.settingsValueDefinitions,
    context.settingsValues,
  );
  const commands = parseWorkflowVariableSetCommands(output);
  if (commands.length > 0) {
    context.setWorkflowVariables(commands);
  }
  return output;
}
