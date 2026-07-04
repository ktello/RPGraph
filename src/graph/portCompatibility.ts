import type { Connection, Edge } from '@xyflow/react';
import type { PortSnapshot, SettingsValueDefinition, WorkflowNode } from '../types';
import { wireLinkName } from '../nodes/memory-slot/model';
import { getRegisteredNode } from '../nodes/registry';
import { settingsValueEntries, settingsValueHandle } from '../workflow';

export type PortCompatibilityResult =
  | { ok: true; source: PortSnapshot; target: PortSnapshot }
  | { ok: false; reason: string; source?: PortSnapshot; target?: PortSnapshot };

export function validatePortConnection(
  nodes: WorkflowNode[],
  edges: Edge[],
  connection: Connection,
  ignoredEdgeId?: string,
  settingsValueDefinitions: SettingsValueDefinition[] = [],
): PortCompatibilityResult {
  const sourceNode = nodes.find((node) => node.id === connection.source);
  const targetNode = nodes.find((node) => node.id === connection.target);
  if (!sourceNode || !targetNode) {
    return { ok: false, reason: 'Connection needs a source node and a target node.' };
  }

  const source = findNodePort(sourceNode, 'output', connection.sourceHandle);
  const target = findNodePort(targetNode, 'input', connection.targetHandle);
  if (!source || !target) {
    return { ok: false, reason: 'Connection needs a valid output port and input port.', source, target };
  }

  const sourceType = effectivePortType(nodes, edges, sourceNode, source, connection, ignoredEdgeId, settingsValueDefinitions);
  const targetType = effectivePortType(nodes, edges, targetNode, target, connection, ignoredEdgeId, settingsValueDefinitions);

  if (arePortTypesCompatible(sourceType, targetType)) {
    return { ok: true, source, target };
  }

  return {
    ok: false,
    source,
    target,
    reason: `Cannot connect ${portTypeLabel(sourceType)} output to ${portTypeLabel(targetType)} input.`,
  };
}

function arePortTypesCompatible(sourceType: string, targetType: string) {
  const source = normalizePortType(sourceType);
  const target = normalizePortType(targetType);
  if (source === 'any' || target === 'any') {
    return true;
  }
  if (source === 'image' || target === 'image') {
    return source === 'image' && target === 'image';
  }
  if (source === target) {
    return true;
  }
  return source === 'mixed' || target === 'mixed';
}

function findNodePort(
  node: WorkflowNode,
  direction: PortSnapshot['direction'],
  handle: string | null | undefined,
) {
  const handleId = handle ?? 'default';
  return nodePorts(node).find((port) =>
    port.direction === direction &&
    (port.id === handleId || (!handle && port.id === 'default')),
  );
}

function nodePorts(node: WorkflowNode): PortSnapshot[] {
  if (node.data.kind !== undefined) {
    return node.data.portsSnapshot ?? [];
  }
  const definition = getRegisteredNode(node.data.nodeType);
  return definition?.ports(node.data) ?? [];
}

function effectivePortType(
  nodes: WorkflowNode[],
  edges: Edge[],
  node: WorkflowNode,
  port: PortSnapshot,
  connection: Connection,
  ignoredEdgeId?: string,
  settingsValueDefinitions: SettingsValueDefinition[] = [],
) {
  if (node.data.kind === undefined && node.data.nodeType === 'settings-value' && port.direction === 'output') {
    const entry = settingsValueEntries(node.data).find(
      (candidate) => settingsValueHandle(candidate.id) === port.id,
    );
    const definition = entry
      ? settingsValueDefinitions.find((candidate) => candidate.key === entry.optionKey)
      : undefined;
    return definition?.valueKind ?? 'text';
  }
  if (node.data.kind !== undefined || node.data.nodeType !== 'memory-slot') {
    return port.valueType;
  }
  return inferWireLinkType(nodes, edges, node, connection, ignoredEdgeId) ?? 'any';
}

function inferWireLinkType(
  nodes: WorkflowNode[],
  edges: Edge[],
  node: WorkflowNode,
  connection: Connection,
  ignoredEdgeId?: string,
) {
  const slotKey = safeWireLinkKey(node);
  if (!slotKey) {
    return null;
  }
  const peerIds = new Set(
    nodes
      .filter((candidate) =>
        candidate.data.kind === undefined &&
        candidate.data.nodeType === 'memory-slot' &&
        safeWireLinkKey(candidate) === slotKey,
      )
      .map((candidate) => candidate.id),
  );
  const candidateTypes = edges
    .filter((edge) => edge.id !== ignoredEdgeId)
    .flatMap((edge) => {
      if (peerIds.has(edge.target) && edge.target !== connection.target) {
        return connectedPortType(nodes, edge.source, 'output', edge.sourceHandle);
      }
      if (peerIds.has(edge.source) && edge.source !== connection.source) {
        return connectedPortType(nodes, edge.target, 'input', edge.targetHandle);
      }
      return [];
    })
    .filter((value): value is string => !!value && value !== 'mixed');
  return candidateTypes[0] ?? null;
}

function connectedPortType(
  nodes: WorkflowNode[],
  nodeId: string,
  direction: PortSnapshot['direction'],
  handle: string | null | undefined,
) {
  const node = nodes.find((candidate) => candidate.id === nodeId);
  if (!node || (node.data.kind === undefined && node.data.nodeType === 'memory-slot')) {
    return null;
  }
  return findNodePort(node, direction, handle)?.valueType ?? null;
}

function safeWireLinkKey(node: WorkflowNode) {
  try {
    return wireLinkName(node.data).toLocaleLowerCase();
  } catch {
    return null;
  }
}

function normalizePortType(value: string) {
  return value.trim().toLowerCase();
}

function portTypeLabel(value: string) {
  const normalized = normalizePortType(value);
  return normalized === 'any' ? 'empty Wire Link' : normalized || 'unknown';
}
