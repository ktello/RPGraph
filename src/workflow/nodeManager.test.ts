import { describe, it, expect } from 'vitest';
import type { Edge } from '@xyflow/react';
import {
  hydrateNodeData,
  persistentNodeData,
  removeEdgesConnectedToIncompatibleNodes,
} from './persistence';
import { getRegisteredCoreNode } from '../nodes/registry';
import { currentCoreNodeVersions } from '../nodes/nodeVersion';
import type { HydrateContext } from '../nodes/types';
import type { WorkflowNode, WorkflowNodeData } from '../types';

type Disabled = Extract<WorkflowNodeData, { kind: 'disabled-core-node' }>;

function context(disabled: string[]): HydrateContext {
  return {
    defaultConnectionId: 'default',
    connectionIds: new Set(['default']),
    disabledNodeTypes: new Set(disabled),
  };
}

function textReplaceSaved() {
  return {
    nodeType: 'text-replace',
    nodeDataVersion: currentCoreNodeVersions['text-replace'],
    label: 'Text Replace',
    description: 'Swap source text for replacements',
    preview: 'No replacements configured',
    textReplaceEntries: [{ id: 'a', source: 'x', replacement: 'y' }],
  };
}

describe('node manager: disabled type degradation', () => {
  it('hydrates a disabled type to a disabled placeholder with ports and stored data', () => {
    const data = hydrateNodeData(textReplaceSaved(), context(['text-replace']));
    expect(data.kind).toBe('disabled-core-node');
    const placeholder = data as Disabled;
    expect((placeholder.storedData.textReplaceEntries as unknown[]).length).toBe(1);
    expect(placeholder.portsSnapshot.some((port) => port.direction === 'input')).toBe(true);
    expect(placeholder.portsSnapshot.filter((port) => port.direction === 'output')).toHaveLength(2);
  });

  it('hydrates normally when the type is enabled', () => {
    const data = hydrateNodeData(textReplaceSaved(), context([]));
    expect(data.kind).toBeUndefined();
    expect(data.nodeType).toBe('text-replace');
  });

  it('round-trips a disabled placeholder back to its original data on save', () => {
    const placeholder = hydrateNodeData(textReplaceSaved(), context(['text-replace']));
    const persisted = persistentNodeData(placeholder);
    expect(persisted.kind).toBeUndefined();
    expect(persisted.nodeType).toBe('text-replace');
    expect((persisted.textReplaceEntries ?? []).length).toBe(1);
  });

  it('restores a working node from the saved placeholder once re-enabled', () => {
    const placeholder = hydrateNodeData(textReplaceSaved(), context(['text-replace']));
    const persisted = persistentNodeData(placeholder);
    const restored = hydrateNodeData(persisted, context([]));
    expect(restored.kind).toBeUndefined();
    expect(restored.nodeType).toBe('text-replace');
  });

  it('computes data-dependent ports for a disabled combiner from its data', () => {
    const data = hydrateNodeData(
      {
        nodeType: 'combiner',
        nodeDataVersion: currentCoreNodeVersions['combiner'],
        label: 'Text Combiner',
        description: 'Merge ordered text inputs',
        preview: 'Waiting',
        combinerInputCount: 4,
      },
      context(['combiner']),
    );
    const inputs = (data as Disabled).portsSnapshot.filter((port) => port.direction === 'input');
    expect(inputs).toHaveLength(4);
  });

  it('does not delete edges connected to a disabled placeholder', () => {
    const placeholder = hydrateNodeData(textReplaceSaved(), context(['text-replace']));
    const nodes = [
      { id: 'n1', type: 'workflow', position: { x: 0, y: 0 }, data: placeholder },
    ] as WorkflowNode[];
    const edges = [{ id: 'e1', source: 'src', target: 'n1' }] as Edge[];
    expect(removeEdgesConnectedToIncompatibleNodes(nodes, edges)).toHaveLength(1);
  });

  it('locks load-bearing types from being disabled', () => {
    expect(getRegisteredCoreNode('input')?.disableable).toBe(false);
    expect(getRegisteredCoreNode('output')?.disableable).toBe(false);
    expect(getRegisteredCoreNode('text-replace')?.disableable).not.toBe(false);
  });
});
