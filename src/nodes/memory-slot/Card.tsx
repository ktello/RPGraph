import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { wireLinkMode, wireLinkName } from './model';

export function MemorySlotNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const mode = wireLinkMode(data);
  const linkName = wireLinkName(data);
  const role = mode === 'joined' ? 'WIRE LINK' : mode === 'input' ? 'SAVE' : 'LOAD';

  return (
    <div
      className={`wire-link-node wire-link-${mode}${runStateClassName(data)}`}
      ref={nodeBodyRef}
      title={`${role} ${linkName}. Double-click to ${mode === 'joined' ? 'split this link' : 'spawn the matching half'}.`}
    >
      {mode !== 'output' && <Handle type="target" position={Position.Left} />}
      <div className="wire-link-shape">
        {mode === 'joined' ? (
          <>
            <div className="wire-link-content">
              <span>{role}</span>
              <strong>{linkName}</strong>
            </div>
            <span className="wire-link-hint">
              DOUBLE-CLICK
              <small>TO SEPARATE</small>
            </span>
          </>
        ) : (
          <div className="wire-link-content">
            <strong>{linkName}</strong>
          </div>
        )}
      </div>
      {mode !== 'input' && <Handle type="source" position={Position.Right} />}
    </div>
  );
}
