import { NodeResizeControl, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { useNodeActions } from '../NodeActionsContext';
import { coreNodeLayouts } from '../nodeLayout';
import { useNodeLayoutSync } from '../shared/CardView';

export function GroupNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { updateData } = useNodeActions();
  const groupTitle = data.groupTitle ?? data.label;

  return (
    <div className="workflow-node group-node" ref={nodeBodyRef}>
      <NodeResizeControl
        className="group-resize-control"
        minHeight={coreNodeLayouts.group.minHeight}
        minWidth={coreNodeLayouts.group.minWidth}
      />
      <div className="group-node-header">
        <input
          className="group-title-input nodrag"
          aria-label="Group title"
          value={groupTitle}
          onChange={(event) => updateData(id, {
            groupTitle: event.currentTarget.value,
            label: event.currentTarget.value.trim() || 'Node Group',
          })}
        />
      </div>
    </div>
  );
}
