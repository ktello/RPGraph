import type { WorkflowNode } from '../../types';
import { formatLastMessageForContext } from '../../workflow/textHelpers';
import type { ExecuteContext } from '../types';

export async function executeLastRpOutputNode(node: WorkflowNode, context: ExecuteContext) {
  const latestOutputMessage = [...context.historyMessages]
    .reverse()
    .find((message) => message.role === 'output' && message.includeInHistory !== false);
  const text =
    node.data.includeRpDateTime && latestOutputMessage
      ? formatLastMessageForContext(
          latestOutputMessage,
          false,
          context.rpDateTimeFormat,
          context.rpWeekdayLanguage,
          true,
        )
      : context.lastRpOutput;
  context.updateRuntimeData(node.id, {
    preview: text ? 'Last RP output available' : 'No RP output yet',
    fullText: text,
  });
  return text;
}
