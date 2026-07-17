import { describe, it, expect } from 'vitest';
import type { WorkflowNode } from '../types';
import { coreNodeLayouts, normalizeNodeLayout, styleForLayout, type NodeLayout } from './nodeLayout';
import { getRegisteredCoreNode } from './registry';

function node(partial: Partial<WorkflowNode>): WorkflowNode {
  return {
    id: 'n1',
    type: 'workflow',
    position: { x: 0, y: 0 },
    data: { nodeType: 'text-replace', label: 'T', description: 'd', preview: 'p' },
    ...partial,
  } as WorkflowNode;
}

describe('styleForLayout', () => {
  it('strips size keys for auto mode and keeps other style entries', () => {
    expect(styleForLayout({ mode: 'auto', width: 430 }, { width: 430, opacity: 0.5 })).toEqual({
      opacity: 0.5,
    });
    expect(styleForLayout({ mode: 'auto', width: 430 }, undefined)).toBeUndefined();
  });

  it('applies resizable defaults', () => {
    const layout: NodeLayout = {
      mode: 'resizable', width: 548, height: 1140, minWidth: 548, minHeight: 1140,
    };
    expect(styleForLayout(layout, undefined)).toEqual({ width: 548, height: 1140 });
  });

  it('passes manual styles through untouched', () => {
    expect(styleForLayout({ mode: 'manual' }, { width: 218, height: 72 })).toEqual({
      width: 218,
      height: 72,
    });
  });
});

describe('normalizeNodeLayout', () => {
  const autoLayout = { layout: coreNodeLayouts['text-replace'] };
  const writeTextLayout = { layout: coreNodeLayouts['write-text'] };
  const llmPromptDefinition = () => getRegisteredCoreNode('llm-prompt')!;

  it('strips a drifted auto save (style width only)', () => {
    const result = normalizeNodeLayout(node({ style: { width: 250 } }), autoLayout);
    expect(result.style).toEqual({});
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
    expect(result.measured).toBeUndefined();
  });

  it('strips top-level-only dims for auto nodes', () => {
    const result = normalizeNodeLayout(
      node({ width: 250, height: 300, measured: { width: 250, height: 300 } }),
      autoLayout,
    );
    expect(result.style?.width).toBeUndefined();
    expect(result.width).toBeUndefined();
    expect(result.measured).toBeUndefined();
  });

  it('clamps a below-minimum resizable save up to bounds', () => {
    const result = normalizeNodeLayout(node({ style: { width: 300, height: 200 } }), writeTextLayout);
    expect(result.style).toEqual({ width: 365, height: 265 });
  });

  it('prefers top-level dims over style, matching React Flow precedence', () => {
    const result = normalizeNodeLayout(
      node({ width: 400, height: 500, style: { width: 900, height: 900 } }),
      writeTextLayout,
    );
    expect(result.style).toEqual({ width: 400, height: 500 });
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
  });

  it('forces the width of vertical-only resizable nodes and heals the legacy 660 height', () => {
    const result = normalizeNodeLayout(
      node({ height: 660, style: { width: 900 } }),
      llmPromptDefinition(),
    );
    expect(result.style?.width).toBe(548);
    expect(result.style?.height).toBe(1140);
    expect(result.height).toBeUndefined();
  });

  it('defaults a resizable node with no saved size', () => {
    const result = normalizeNodeLayout(node({}), writeTextLayout);
    expect(result.style).toEqual({ width: 365, height: 390 });
  });

  it('preserves the text-preview legacy migration through the hydrateStyle override', () => {
    const definition = getRegisteredCoreNode('text-preview')!;
    const result = normalizeNodeLayout(
      node({
        style: { width: 390, height: 350 },
        data: { nodeType: 'text-preview', label: 'T', description: 'd', preview: 'p' },
      } as Partial<WorkflowNode>),
      definition,
    );
    expect(result.style).toEqual({ width: 365, height: 455 });
  });

  it('keeps in-range text-preview sizes (migration only fires on the exact legacy pair)', () => {
    const definition = getRegisteredCoreNode('text-preview')!;
    const result = normalizeNodeLayout(
      node({
        style: { width: 390, height: 400 },
        data: { nodeType: 'text-preview', label: 'T', description: 'd', preview: 'p' },
      } as Partial<WorkflowNode>),
      definition,
    );
    expect(result.style).toEqual({ width: 390, height: 400 });
  });

  it('applies memory-slot manual mode styles and clears top-level dims', () => {
    const definition = getRegisteredCoreNode('memory-slot')!;
    const result = normalizeNodeLayout(
      node({
        width: 900,
        height: 900,
        data: {
          nodeType: 'memory-slot',
          label: 'Wire Link',
          description: 'd',
          preview: 'p',
          memorySlotName: 'A',
          memorySlotText: '',
          memorySlotMode: 'joined',
        },
      } as Partial<WorkflowNode>),
      definition,
    );
    expect(result.style?.width).toBeDefined();
    expect(result.width).toBeUndefined();
    expect(result.height).toBeUndefined();
    expect(result.measured).toBeUndefined();
  });
});

describe('decorated create()', () => {
  it('creates auto nodes without persisted size', () => {
    const definition = getRegisteredCoreNode('text-replace')!;
    const created = definition.create({
      defaultConnectionId: 'c1',
      position: { x: 0, y: 0 },
      createId: (prefix: string) => `${prefix}-t`,
      readNodes: () => [],
    } as never);
    expect(created.style?.width).toBeUndefined();
    expect(created.style?.height).toBeUndefined();
  });

  it('creates resizable nodes at layout defaults', () => {
    const definition = getRegisteredCoreNode('llm-prompt')!;
    const created = definition.create({
      defaultConnectionId: 'c1',
      position: { x: 0, y: 0 },
      createId: (prefix: string) => `${prefix}-t`,
      readNodes: () => [],
    } as never);
    expect(created.style).toMatchObject({ width: 548, height: 1140 });
  });

  it('keeps manual create styles (memory-slot wire link)', () => {
    const definition = getRegisteredCoreNode('memory-slot')!;
    const created = definition.create({
      defaultConnectionId: 'c1',
      position: { x: 0, y: 0 },
      createId: (prefix: string) => `${prefix}-t`,
      readNodes: () => [],
    } as never);
    expect(created.style?.width).toBeDefined();
  });
});
