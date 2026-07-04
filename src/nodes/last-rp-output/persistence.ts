import type { WorkflowNodeData } from '../../types';
import type { CorePersistence } from '../corePersistence';

function lastRpOutputData(data: WorkflowNodeData): WorkflowNodeData {
  return {
    nodeType: data.nodeType,
    label: data.label,
    description: data.description,
    preview: 'No RP output yet',
    includeRpDateTime: data.includeRpDateTime ?? false,
  } as WorkflowNodeData;
}

export const lastRpOutputPersistence: CorePersistence = {
  saveData: lastRpOutputData,
  hydrateData: lastRpOutputData,
};
