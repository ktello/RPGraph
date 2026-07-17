import type { WorkflowNodeData } from '../../types';
import type { HydrateContext } from '../types';

export function baseData(data: WorkflowNodeData, preview: string): WorkflowNodeData {
  return {
    nodeType: data.nodeType,
    label: data.label,
    description: data.description,
    preview,
  } as WorkflowNodeData;
}

export function connectionId(data: WorkflowNodeData, context: HydrateContext) {
  return data.connectionId && context.connectionIds.has(data.connectionId)
    ? data.connectionId
    : context.defaultConnectionId;
}

export function preservedData(
  data: WorkflowNodeData,
  preview: string,
  fields: Partial<WorkflowNodeData>,
) {
  return { ...baseData(data, preview), ...fields } as WorkflowNodeData;
}
