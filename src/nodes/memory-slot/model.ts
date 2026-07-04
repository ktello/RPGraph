import type { WorkflowNode, WorkflowNodeData } from '../../types';

export type WireLinkMode = 'joined' | 'input' | 'output';

export const wireLinkLayout = {
  joinedWidth: 218,
  joinedHeight: 72,
  halfWidth: 97,
  halfHeight: 50,
  spawnOffset: 258,
} as const;

export function wireLinkMode(data: Pick<WorkflowNodeData, 'memorySlotMode'>): WireLinkMode {
  if (!data.memorySlotMode) {
    throw new Error('Wire Link has no mode.');
  }
  return data.memorySlotMode;
}

export function wireLinkName(data: Pick<WorkflowNodeData, 'memorySlotName'>) {
  const name = data.memorySlotName?.trim();
  if (!name) {
    throw new Error('Wire Link has no number.');
  }
  return name;
}

export function wireLinkStyle(mode: WireLinkMode) {
  return {
    width: mode === 'joined' ? wireLinkLayout.joinedWidth : wireLinkLayout.halfWidth,
    height: mode === 'joined' ? wireLinkLayout.joinedHeight : wireLinkLayout.halfHeight,
  };
}

export function nextWireLinkName(nodes: WorkflowNode[]) {
  const highestNumber = nodes.reduce((highest, node) => {
    if (node.data.nodeType !== 'memory-slot') {
      return highest;
    }
    const match = node.data.memorySlotName?.trim().match(/^\d+$/);
    return match ? Math.max(highest, Number(match[0])) : highest;
  }, 0);
  return String(highestNumber + 1).padStart(2, '0');
}
