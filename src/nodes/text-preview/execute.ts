import type { WorkflowNode } from '../../types';
import { parseWorkflowVariableSetCommands } from '../../workflow';
import type { ExecuteContext } from '../types';

export async function executeTextPreviewNode(node: WorkflowNode, context: ExecuteContext) {
  const incomingEdge = context.edges.find((edge) => edge.target === node.id);
  if (!incomingEdge) {
    throw new Error('Text Preview has no incoming Mixed connection.');
  }
  const inputValue = await context.executeInput(incomingEdge.source, incomingEdge.sourceHandle);
  const commands = parseWorkflowVariableSetCommands(inputValue);
  if (commands.length > 0) {
    context.setWorkflowVariables(commands);
  }
  context.updateRuntimeData(node.id, {
    preview: commands.length > 0
      ? `Text received; set ${commands.length} variable${commands.length === 1 ? '' : 's'}`
      : inputValue
        ? 'Text received'
        : 'Empty text received',
    fullText: inputValue,
    displayTokenBytesPerToken: context.textMetrics.bytesPerToken,
  });
  return inputValue;
}
