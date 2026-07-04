import type { NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../types';

export function IncompatibleCoreNodeCard({ data }: NodeProps<WorkflowNode>) {
  return (
    <div className="workflow-node incompatible-core-node">
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label || 'Incompatible Node'}</strong>
      </div>
      <span className="node-description">{data.description || data.nodeType}</span>
      <p className="incompatible-core-node-note">
        Disabled incompatible core node
      </p>
      <dl className="incompatible-core-node-details">
        <div>
          <dt>Node type</dt>
          <dd>{data.nodeType}</dd>
        </div>
        <div>
          <dt>Stored version</dt>
          <dd>{data.nodeDataVersion}</dd>
        </div>
        <div>
          <dt>Required version</dt>
          <dd>{data.currentNodeVersion}</dd>
        </div>
      </dl>
      <p className="incompatible-core-node-hint">
        Add the current node from the node menu and reconnect it manually.
      </p>
    </div>
  );
}
