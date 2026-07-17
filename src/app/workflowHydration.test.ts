import { describe, it, expect } from 'vitest';
import { hydrateLoadedWorkflow } from './workflowHydration';
import { currentWorkflowFormatVersion } from '../workflow/version';
import { currentCoreNodeVersions } from '../nodes/nodeVersion';

function workflowWith(nodes: unknown[]) {
  return {
    format: 'rpgraph-workflow',
    formatVersion: currentWorkflowFormatVersion,
    savedAt: '2026-01-01T00:00:00.000Z',
    nodes,
    edges: [],
  };
}

describe('hydrateLoadedWorkflow node sizing', () => {
  it('strips stale dimensions from an incompatible core node so it re-measures to its card', () => {
    const workflow = workflowWith([
      {
        id: 'old-llm',
        type: 'workflow',
        position: { x: 5, y: 5 },
        style: { width: 548, height: 1140 },
        width: 548,
        height: 1140,
        measured: { width: 548, height: 1140 },
        data: {
          nodeType: 'llm-prompt',
          nodeDataVersion: '0.0.1',
          label: 'Old LLM',
          description: 'outdated',
          preview: 'stored',
          llmPromptBefore: 'keep me',
        },
      },
    ]);

    const { nodes } = hydrateLoadedWorkflow({
      workflow,
      defaultConnectionId: 'default',
      connectionIds: new Set(['default']),
    });

    const node = nodes[0];
    expect(node.data.kind).toBe('incompatible-core-node');
    expect(node.width).toBeUndefined();
    expect(node.height).toBeUndefined();
    expect(node.measured).toBeUndefined();
    const style = (node.style ?? {}) as Record<string, unknown>;
    expect(style.width).toBeUndefined();
    expect(style.height).toBeUndefined();
  });

  it('clamps a below-minimum resizable save and makes style the only size carrier', () => {
    const workflow = workflowWith([
      {
        id: 'live-writer',
        type: 'workflow',
        position: { x: 400, y: 5 },
        width: 300,
        height: 200,
        style: { width: 300, height: 200 },
        data: {
          nodeType: 'write-text',
          nodeDataVersion: currentCoreNodeVersions['write-text'],
          label: 'Writer',
          description: 'current',
          preview: 'Text ready',
          writeTextValue: 'keep me',
        },
      },
    ]);

    const { nodes } = hydrateLoadedWorkflow({
      workflow,
      defaultConnectionId: 'default',
      connectionIds: new Set(['default']),
    });

    const writer = nodes.find((node) => node.id === 'live-writer')!;
    expect(writer.data.kind).toBeUndefined();
    // Below the write-text 365x265 minimums: heals up, and the top-level
    // carriers React Flow would prefer over style are cleared.
    expect(writer.style).toEqual({ width: 365, height: 265 });
    expect(writer.width).toBeUndefined();
    expect(writer.height).toBeUndefined();
    expect(writer.measured).toBeUndefined();
    expect(writer.data.writeTextValue).toBe('keep me');
  });

  it('preserves an in-range resizable size in style', () => {
    const workflow = workflowWith([
      {
        id: 'live-writer',
        type: 'workflow',
        position: { x: 400, y: 5 },
        width: 400,
        height: 500,
        data: {
          nodeType: 'write-text',
          nodeDataVersion: currentCoreNodeVersions['write-text'],
          label: 'Writer',
          description: 'current',
          preview: 'Text ready',
        },
      },
    ]);

    const { nodes } = hydrateLoadedWorkflow({
      workflow,
      defaultConnectionId: 'default',
      connectionIds: new Set(['default']),
    });

    const writer = nodes.find((node) => node.id === 'live-writer')!;
    expect(writer.style).toEqual({ width: 400, height: 500 });
    expect(writer.width).toBeUndefined();
    expect(writer.height).toBeUndefined();
  });

  it('heals a drifted auto-node save by stripping every size carrier', () => {
    const workflow = workflowWith([
      {
        id: 'drifted-replace',
        type: 'workflow',
        position: { x: 5, y: 5 },
        width: 250,
        style: { width: 250 },
        measured: { width: 250, height: 300 },
        data: {
          nodeType: 'text-replace',
          nodeDataVersion: currentCoreNodeVersions['text-replace'],
          label: 'Text Replace',
          description: 'current',
          preview: 'No replacements configured',
          textReplaceEntries: [{ id: 'a', source: 'x', replacement: 'y' }],
        },
      },
    ]);

    const { nodes } = hydrateLoadedWorkflow({
      workflow,
      defaultConnectionId: 'default',
      connectionIds: new Set(['default']),
    });

    const replace = nodes.find((node) => node.id === 'drifted-replace')!;
    expect(replace.data.kind).toBeUndefined();
    const style = (replace.style ?? {}) as Record<string, unknown>;
    expect(style.width).toBeUndefined();
    expect(style.height).toBeUndefined();
    expect(replace.width).toBeUndefined();
    expect(replace.height).toBeUndefined();
    expect(replace.measured).toBeUndefined();
  });
});
