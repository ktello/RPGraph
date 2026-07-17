import type { WorkflowNodeData } from '../../types';
import type { CoreNodePersistence } from '../types';

function lastUserInputData(data: WorkflowNodeData): WorkflowNodeData {
  return {
    nodeType: data.nodeType,
    label: data.label,
    description: data.description,
    preview: 'No user input yet',
    includeRpDateTime: data.includeRpDateTime ?? false,
  } as WorkflowNodeData;
}

export const lastUserInputPersistence: CoreNodePersistence = {
  saveData: lastUserInputData,
  hydrateData: lastUserInputData,
};
