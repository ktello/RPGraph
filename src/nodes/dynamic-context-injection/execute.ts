import type { DynamicContextRule, WorkflowNode } from '../../types';
import {
  storybookImageListContextText,
  storybookImageListsFromNodes,
  storybookCharacterContextText,
  storyCharactersFromNodes,
} from '../../storybook/runtime';
import { resolveConnectedImages } from '../shared/imageInputs';
import type { ExecuteContext } from '../types';

export const dynamicContextPorts = [
  { id: 'text', valueType: 'text', inputLabel: 'Text Input', outputLabel: 'Text Output' },
  { id: 'image', valueType: 'image', inputLabel: 'Image Input', outputLabel: 'Image Output' },
  { id: 'condition-1', valueType: 'number', inputLabel: 'Condition 1', outputLabel: 'Condition 1' },
  { id: 'condition-2', valueType: 'number', inputLabel: 'Condition 2', outputLabel: 'Condition 2' },
  { id: 'condition-3', valueType: 'number', inputLabel: 'Condition 3', outputLabel: 'Condition 3' },
] as const;

type DynamicContextRuleResult = {
  index: number;
  match: boolean;
};

function dynamicContextRules(data: WorkflowNode['data']): DynamicContextRule[] {
  return Array.isArray(data.dynamicContextRules)
    ? data.dynamicContextRules.filter((rule) => rule.conditionText.trim())
    : [];
}

function parseLooseJsonObject(text: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return undefined;
    }
    try {
      const parsed = JSON.parse(match[0]);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
}

function parseMatchedRuleIndexes(text: string): Set<number> {
  const parsed = parseLooseJsonObject(text);
  const matches = parsed?.matches;
  if (Array.isArray(matches)) {
    return new Set(
      matches
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    );
  }
  if (typeof matches === 'number' && Number.isInteger(matches) && matches > 0) {
    return new Set([matches]);
  }
  if (typeof matches === 'string') {
    const normalized = matches.trim().toLowerCase();
    if (!normalized || normalized === 'none' || normalized === 'no' || normalized === 'false' || normalized === '0') {
      return new Set();
    }
    return new Set(
      normalized
        .split(/[\s,;]+/)
        .map((entry) => Number(entry.replace(/^rule\s*/i, '')))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    );
  }
  return new Set();
}

function parseRuleResults(text: string, ruleCount: number): DynamicContextRuleResult[] {
  const matchedIndexes = parseMatchedRuleIndexes(text);
  return Array.from({ length: ruleCount }, (_, index) => {
    return {
      index: index + 1,
      match: matchedIndexes.has(index + 1),
    };
  });
}

function matchedRulePreview(results: DynamicContextRuleResult[]) {
  const matchedLabels = results
    .filter((result) => result.match)
    .map((result) => `R${result.index}`);
  return matchedLabels.length ? `Matched ${matchedLabels.join(' + ')}` : 'No context rules matched';
}

function matchedRuleContext(rule: DynamicContextRule, index: number, context: ExecuteContext) {
  const character = storyCharactersFromNodes(context.nodes).find((entry) => entry.id === rule.contextId);
  if (character) {
    return storybookCharacterContextText(character);
  }
  const imageList = storybookImageListsFromNodes(context.nodes).find((entry) => entry.id === rule.contextId);
  if (imageList) {
    return storybookImageListContextText(imageList);
  }
  return `Rule ${index + 1} True`;
}

function appendMatchedRuleContext(
  inputValue: string,
  rules: DynamicContextRule[],
  results: DynamicContextRuleResult[],
  context: ExecuteContext,
) {
  const matchedIndexes = new Set(results.filter((result) => result.match).map((result) => result.index));
  const beforeContext: string[] = [];
  const afterContext: string[] = [];

  rules.forEach((rule, index) => {
    if (!matchedIndexes.has(index + 1)) {
      return;
    }
    const target = (rule.contextPlacement ?? 'after') === 'before' ? beforeContext : afterContext;
    target.push(matchedRuleContext(rule, index, context));
  });

  return [...beforeContext, inputValue, ...afterContext].filter(Boolean).join('\n\n');
}

async function resolveInputValue(node: WorkflowNode, context: ExecuteContext, targetHandle: string) {
  const incomingEdge = context.edges.find(
    (edge) => edge.target === node.id && (edge.targetHandle ?? dynamicContextPorts[0].id) === targetHandle,
  );
  if (!incomingEdge) {
    return '';
  }
  return context.executeInput(incomingEdge.source, incomingEdge.sourceHandle);
}

async function executeDynamicTextOutput(node: WorkflowNode, context: ExecuteContext) {
  const inputValue = await resolveInputValue(node, context, 'text');
  const rules = dynamicContextRules(node.data);
  if (!inputValue.trim() || rules.length === 0) {
    context.updateRuntimeData(node.id, {
      preview: rules.length === 0 ? 'No context rules configured' : 'Empty text passed through',
      llmCallStats: [],
      fullText: inputValue,
      dynamicContextMatchedRuleIndexes: [],
      displayTokenBytesPerToken: context.textMetrics.bytesPerToken,
    });
    return inputValue;
  }

  const images = await resolveConnectedImages(node, context);
  const prompt = [
    'Analyze the input text and optional image against the listed dynamic context rules.',
    'For each rule, decide whether it is true for the input.',
    'Return JSON only.',
    'If one or more rules match, return exactly this shape with only matching rule numbers: {"matches":[1,4]}',
    'If no rules match, return exactly this JSON: {"matches":"none"}',
    'Do not include false rules. Sort matching rule numbers ascending.',
    'Rules:',
    rules.map((rule, index) => `${index + 1}. ${rule.conditionText.trim()}`).join('\n'),
    'Input text:',
    inputValue,
  ].join('\n\n');

  context.updateRuntimeData(node.id, { preview: 'Checking context rules ...', llmCallStats: [] });
  const output = await context.llm.complete({
    connectionId: node.data.connectionId,
    nodeId: node.id,
    label: 'Dynamic Context Rules',
    prompt,
    images,
    maxTokens: images.length > 0 ? 256 : 80,
    temperature: 0,
    contributesToTokenCalibration: true,
  });
  const results = parseRuleResults(output.text, rules.length);
  const matchedRuleIndexes = results.filter((result) => result.match).map((result) => result.index);
  const textWithContext = appendMatchedRuleContext(inputValue, rules, results, context);

  context.updateRuntimeData(node.id, {
    preview: matchedRulePreview(results),
    fullText: textWithContext,
    dynamicContextMatchedRuleIndexes: matchedRuleIndexes,
    displayTokenBytesPerToken: context.textMetrics.bytesPerToken,
  });
  return textWithContext;
}

export async function executeDynamicContextInjectionNode(node: WorkflowNode, context: ExecuteContext) {
  const sourceHandle = context.sourceHandle ?? dynamicContextPorts[0].id;
  if (sourceHandle === 'text') {
    return executeDynamicTextOutput(node, context);
  }

  const value = await resolveInputValue(node, context, sourceHandle);
  return value;
}
