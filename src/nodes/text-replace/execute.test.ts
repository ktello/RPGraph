import { describe, it, expect } from 'vitest';
import type { Edge } from '@xyflow/react';
import type { TextReplaceEntry, WorkflowNode } from '../../types';
import type { ExecuteContext } from '../types';
import { executeTextReplaceNode } from './execute';

function node(entries: TextReplaceEntry[]): WorkflowNode {
  return {
    id: 'tr-1',
    type: 'workflow',
    position: { x: 0, y: 0 },
    data: {
      nodeType: 'text-replace',
      label: 'Text Replace',
      description: 'd',
      preview: '',
      textReplaceEntries: entries,
    },
  } as WorkflowNode;
}

function edge(id: string, source: string, targetHandle: string | null): Edge {
  return { id, source, target: 'tr-1', sourceHandle: null, targetHandle } as Edge;
}

function createContext(options: { edges: Edge[]; values: Record<string, string> }) {
  const resolved: string[] = [];
  const context = {
    edges: options.edges,
    executeInput: async (nodeId: string) => {
      resolved.push(nodeId);
      return options.values[nodeId] ?? '';
    },
    updateRuntimeData: () => {},
    textMetrics: { bytesPerToken: 4 },
  } as unknown as ExecuteContext;
  return { context, resolved };
}

describe('executeTextReplaceNode replacement overrides', () => {
  it('uses a connected override as the entry replacement and ignores the typed value', async () => {
    const n = node([{ id: 'e1', source: 'Hero', replacement: 'Zed' }]);
    const { context } = createContext({
      edges: [edge('m', 'input-src', null), edge('o1', 'ovr-src', 'replacement:e1')],
      values: { 'input-src': 'Hello Hero', 'ovr-src': 'Aria' },
    });
    expect(await executeTextReplaceNode(n, context)).toBe('Hello Aria');
  });

  it('overrides only the connected entry; others keep their typed replacement', async () => {
    const n = node([
      { id: 'e1', source: 'a', replacement: '1' },
      { id: 'e2', source: 'b', replacement: '2' },
    ]);
    const { context } = createContext({
      edges: [edge('m', 'input-src', null), edge('o1', 'ovr-src', 'replacement:e1')],
      values: { 'input-src': 'a b', 'ovr-src': 'X' },
    });
    expect(await executeTextReplaceNode(n, context)).toBe('X 2');
  });

  it('treats an attached-but-empty override as an empty replacement (deletes the match)', async () => {
    const n = node([{ id: 'e1', source: 'Hero', replacement: 'Zed' }]);
    const { context } = createContext({
      edges: [edge('m', 'input-src', null), edge('o1', 'ovr-src', 'replacement:e1')],
      values: { 'input-src': 'a Hero b', 'ovr-src': '' },
    });
    expect(await executeTextReplaceNode(n, context)).toBe('a  b');
  });

  it('never treats an override edge as the main input (defaults to empty)', async () => {
    const n = node([{ id: 'e1', source: 'Hero', replacement: 'Zed' }]);
    const { context, resolved } = createContext({
      edges: [edge('o1', 'ovr-src', 'replacement:e1')],
      values: { 'ovr-src': 'Aria' },
    });
    // No default input edge → input is empty → replacing in '' yields ''.
    expect(await executeTextReplaceNode(n, context)).toBe('');
    // The override was still resolved, but never used as the main input.
    expect(resolved).toEqual(['ovr-src']);
  });

  it('does not resolve a dangling override edge for a removed entry', async () => {
    const n = node([{ id: 'e1', source: 'Hero', replacement: 'Zed' }]);
    const { context, resolved } = createContext({
      edges: [edge('m', 'input-src', null), edge('stale', 'gone-src', 'replacement:removed-id')],
      values: { 'input-src': 'Hero', 'gone-src': 'SHOULD-NOT-RUN' },
    });
    expect(await executeTextReplaceNode(n, context)).toBe('Zed');
    expect(resolved).not.toContain('gone-src');
  });

  it('does not mutate the node entries', async () => {
    const entries: TextReplaceEntry[] = [{ id: 'e1', source: 'Hero', replacement: 'Zed' }];
    const n = node(entries);
    const { context } = createContext({
      edges: [edge('m', 'input-src', null), edge('o1', 'ovr-src', 'replacement:e1')],
      values: { 'input-src': 'Hero', 'ovr-src': 'Aria' },
    });
    await executeTextReplaceNode(n, context);
    expect(n.data.textReplaceEntries).toEqual([{ id: 'e1', source: 'Hero', replacement: 'Zed' }]);
  });
});
