import type { ReferenceImage } from '../../chat/referenceImages';
import type { ChatImageAttachment, WorkflowNode } from '../../types';
import { resolveWorkflowVariables } from '../../workflow';
import { promptActionConfigs, withPromptActionRuntimeSettingsList } from '../shared/promptActions';
import { runActionAwarePrompt } from '../shared/promptRun';
import type { ExecuteContext } from '../types';

export async function executeLlmPromptNode({
  node,
  inputValue,
  images,
  referenceImages,
  context,
  streamsVisibleOutput,
}: {
  node: WorkflowNode;
  inputValue: string;
  images: ChatImageAttachment[];
  referenceImages: ReferenceImage[];
  context: ExecuteContext;
  streamsVisibleOutput: boolean;
}) {
  const promptBefore = resolveWorkflowVariables(
    node.data.llmPromptBefore ?? '',
    context.settingsValueDefinitions,
    context.settingsValues,
  );
  const promptAfter = resolveWorkflowVariables(
    node.data.llmPromptAfter ?? '',
    context.settingsValueDefinitions,
    context.settingsValues,
  );
  const combinedPrompt = [promptBefore.trim(), inputValue, promptAfter.trim()]
    .filter(Boolean)
    .join('\n\n');
  if (!inputValue.trim()) {
    context.updateRuntimeData(node.id, {
      preview: 'Skipped: no text input',
      generatedText: '',
      displayTokenBytesPerToken: context.textMetrics.bytesPerToken,
      llmPromptDebug: {
        inputValue,
        promptBefore,
        promptAfter,
        combinedPrompt,
        generatedText: '',
      },
    });
    return '';
  }

  context.updateRuntimeData(node.id, { preview: 'Calling LLM ...', llmCallStats: [] });
  const result = await runActionAwarePrompt({
    node,
    context,
    inputValue,
    images,
    referenceImages,
    promptBefore,
    promptAfter,
    actionConfigs: withPromptActionRuntimeSettingsList(
      promptActionConfigs(node.data.llmPromptActions),
      context.promptActionSettings,
    ),
    streamsVisibleOutput,
    contributesToTokenCalibration: true,
    callLabel: (actionReplayCount) =>
      `Generate${actionReplayCount ? ` / Action replay ${actionReplayCount}` : ''}`,
  });
  context.updateRuntimeData(node.id, {
    preview: `Sent via ${result.connectionLabel}${result.referenceImageCount ? ` (+${result.referenceImageCount} reference images)` : ''}`,
    generatedText: result.generatedText,
    displayTokenBytesPerToken: context.textMetrics.bytesPerToken,
    llmPromptDebug: result.debug,
  });
  return result.generatedText;
}
