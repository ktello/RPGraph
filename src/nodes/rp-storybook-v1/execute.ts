import type { ExecuteContext } from '../types';
import type { WorkflowNode } from '../../types';
import {
  emptyRpStorybookV1,
  parseRpStorybookJson,
  rpStorybookFormattedText,
  rpStorybookJsonText,
} from './model';
import { storybookCharacterInfoText } from '../../storybook/runtime';

export async function executeRpStorybookV1Node(node: WorkflowNode, context: ExecuteContext) {
  const storybook = node.data.storybookJson
    ? parseRpStorybookJson(node.data.storybookJson)
    : emptyRpStorybookV1;

  if (context.sourceHandle === 'formatted-text') {
    return rpStorybookFormattedText(storybook, node.data.storybookFormattedTextSettings);
  }
  if (context.sourceHandle === 'character-info') {
    return storybookCharacterInfoText(rpStorybookJsonText(storybook));
  }
  return rpStorybookJsonText(storybook);
}
