import type { WorkflowNodeData } from '../../types';
import type { CorePersistence } from '../corePersistence';

function lastUserInputData(data: WorkflowNodeData): WorkflowNodeData {
  return {
    nodeType: data.nodeType,
    label: data.label,
    description: data.description,
    preview: 'No user input yet',
    includeRpDateTime: data.includeRpDateTime ?? false,
  } as WorkflowNodeData;
}

export const lastUserInputPersistence: CorePersistence = {
  saveData: lastUserInputData,
  hydrateData: lastUserInputData,
};
