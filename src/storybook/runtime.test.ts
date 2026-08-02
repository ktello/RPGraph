import { describe, it, expect } from 'vitest';
import { blocksSecondStorybookSource, isStorybookSourceType } from './runtime';
import type { WorkflowNode, WorkflowNodeData } from '../types';

function nodeWith(data: WorkflowNodeData): WorkflowNode {
  return { id: 'node-1', position: { x: 0, y: 0 }, data };
}

function liveSourceNode(nodeType: 'rp-storybook' | 'rp-storybook-editor'): WorkflowNode {
  const shared = { label: 'Storybook', description: '', preview: '' };
  return nodeWith(
    nodeType === 'rp-storybook'
      ? { ...shared, nodeType: 'rp-storybook' }
      : { ...shared, nodeType: 'rp-storybook-editor' },
  );
}

function disabledPlaceholderNode(nodeType: 'rp-storybook' | 'rp-storybook-editor' | 'input'): WorkflowNode {
  return nodeWith({
    nodeType,
    nodeDataVersion: '1.0.0',
    kind: 'disabled-core-node',
    storedData: { nodeType },
    portsSnapshot: [],
    label: 'Disabled',
    description: '',
    preview: '',
  });
}

function incompatiblePlaceholderNode(nodeType: 'rp-storybook'): WorkflowNode {
  return nodeWith({
    nodeType,
    nodeDataVersion: '1.0.0',
    currentNodeVersion: '2.0.0',
    kind: 'incompatible-core-node',
    storedData: { nodeType },
    label: 'Incompatible',
    description: '',
    preview: '',
  });
}

describe('isStorybookSourceType', () => {
  it('accepts both storybook source types', () => {
    expect(isStorybookSourceType('rp-storybook')).toBe(true);
    expect(isStorybookSourceType('rp-storybook-editor')).toBe(true);
  });

  it('rejects every other type', () => {
    expect(isStorybookSourceType('input')).toBe(false);
    expect(isStorybookSourceType('output')).toBe(false);
    expect(isStorybookSourceType('')).toBe(false);
  });
});

describe('blocksSecondStorybookSource', () => {
  it('counts a live rp-storybook node', () => {
    expect(blocksSecondStorybookSource(liveSourceNode('rp-storybook'))).toBe(true);
  });

  it('counts a live rp-storybook-editor node', () => {
    expect(blocksSecondStorybookSource(liveSourceNode('rp-storybook-editor'))).toBe(true);
  });

  it('counts a disabled placeholder of either storybook type (re-enable + reload makes it live)', () => {
    expect(blocksSecondStorybookSource(disabledPlaceholderNode('rp-storybook'))).toBe(true);
    expect(blocksSecondStorybookSource(disabledPlaceholderNode('rp-storybook-editor'))).toBe(true);
  });

  it('does not count an incompatible storybook placeholder (the upgrade path guards that conflict)', () => {
    expect(blocksSecondStorybookSource(incompatiblePlaceholderNode('rp-storybook'))).toBe(false);
  });

  it('does not count a disabled placeholder of a non-storybook type', () => {
    expect(blocksSecondStorybookSource(disabledPlaceholderNode('input'))).toBe(false);
  });
});
