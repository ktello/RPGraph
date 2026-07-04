import type { DynamicContextRule, WorkflowNode, WorkflowNodeData } from '../../types';
import {
  storybookCharacterId,
  type RpStorybookV1,
} from '../rp-storybook-v1/model';
import { storybookImageListId } from '../../storybook/runtime';

const imageContextRuleIdPrefix = 'storybook-image-list-rule:';

export type StorybookImageContextRuleSyncResult = {
  dynamicContextNodeCount: number;
  imageListCount: number;
  describedImageCount: number;
  createdCount: number;
  updatedCount: number;
  removedCount: number;
};

type StorybookImageContextRuleSpec = {
  id: string;
  contextId: string;
  conditionText: string;
  label: string;
  describedImageCount: number;
};

function imageContextRuleId(contextId: string) {
  return `${imageContextRuleIdPrefix}${contextId}`;
}

function imageContextRuleCondition(characterName: string) {
  return [
    `Set this rule true only when the latest input and recent messages are about selecting or sending one of ${characterName}'s stored Storybook character images from an Image List.`,
    `Set this rule true if ${characterName} is explicitly expected to send, show, attach, choose, offer, or reference one of ${characterName}'s own stored photos, pictures, selfies, or images in a phone/message beat.`,
    `Set this rule true if another character directly asks ${characterName} for a picture, photo, selfie, image, or asks which stored image ${characterName} can send.`,
    `Set this rule false for general visual scene description, incoming user images, image analysis, outfit descriptions without an intent to send a stored image, or images belonging to another character.`,
  ].join(' ');
}

export function storybookImageContextRuleSpecs(
  storybookNodeId: string,
  storybook: RpStorybookV1,
): StorybookImageContextRuleSpec[] {
  return storybook.characters.flatMap((character, index) => {
    const describedImages = character.images.filter((image) => image.description.trim());
    if (describedImages.length === 0) {
      return [];
    }
    const label = character.name.trim() || character.id || `Character ${index + 1}`;
    const contextId = storybookImageListId(storybookCharacterId(storybookNodeId, character.id, index));
    return [{
      id: imageContextRuleId(contextId),
      contextId,
      conditionText: imageContextRuleCondition(label),
      label,
      describedImageCount: describedImages.length,
    }];
  });
}

function dynamicContextRules(data: WorkflowNodeData): DynamicContextRule[] {
  return Array.isArray(data.dynamicContextRules) ? data.dynamicContextRules : [];
}

export function syncStorybookImageContextRules(
  nodes: WorkflowNode[],
  storybookNodeId: string,
  storybook: RpStorybookV1,
  updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void,
): StorybookImageContextRuleSyncResult {
  const specs = storybookImageContextRuleSpecs(storybookNodeId, storybook);
  const specsById = new Map(specs.map((spec) => [spec.id, spec]));
  const storybookRulePrefix = `${imageContextRuleIdPrefix}${storybookNodeId}:`;
  let createdCount = 0;
  let updatedCount = 0;
  let removedCount = 0;
  let dynamicContextNodeCount = 0;

  nodes.forEach((node) => {
    if (node.data.kind !== undefined || node.data.nodeType !== 'dynamic-context-injection') {
      return;
    }
    dynamicContextNodeCount += 1;
    const currentRules = dynamicContextRules(node.data);
    if (node.data.dynamicContextImageRulesEnabled === false) {
      const nextRules = currentRules.filter((rule) => !rule.id.startsWith(storybookRulePrefix));
      if (nextRules.length !== currentRules.length) {
        removedCount += currentRules.length - nextRules.length;
        updateNodeData(node.id, { dynamicContextRules: nextRules });
      }
      return;
    }
    let changed = false;
    const nextRules = currentRules.flatMap((rule) => {
      if (!rule.id.startsWith(storybookRulePrefix)) {
        return [rule];
      }
      const spec = specsById.get(rule.id);
      if (!spec) {
        removedCount += 1;
        changed = true;
        return [];
      }
      const nextRule: DynamicContextRule = {
        ...rule,
        conditionText: spec.conditionText,
        contextId: spec.contextId,
        contextPlacement: rule.contextPlacement ?? 'after',
      };
      if (
        nextRule.conditionText !== rule.conditionText ||
        nextRule.contextId !== rule.contextId ||
        nextRule.contextPlacement !== rule.contextPlacement
      ) {
        updatedCount += 1;
        changed = true;
      }
      return [nextRule];
    });

    specs.forEach((spec) => {
      if (nextRules.some((rule) => rule.id === spec.id)) {
        return;
      }
      nextRules.push({
        id: spec.id,
        conditionText: spec.conditionText,
        contextId: spec.contextId,
        contextPlacement: 'after',
      });
      createdCount += 1;
      changed = true;
    });

    if (changed) {
      updateNodeData(node.id, { dynamicContextRules: nextRules });
    }
  });

  return {
    dynamicContextNodeCount,
    imageListCount: specs.length,
    describedImageCount: specs.reduce((total, spec) => total + spec.describedImageCount, 0),
    createdCount,
    updatedCount,
    removedCount,
  };
}
