import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../types';

// Inert placeholder for a node whose type the user disabled in the Node Manager.
// Renders the stored ports so connected edges stay attached; the node's original
// data is preserved and restored when the type is re-enabled and reloaded.
export function DisabledCoreNodeCard({ data }: NodeProps<WorkflowNode>) {
  const inputs = data.portsSnapshot?.filter((port) => port.direction === 'input') ?? [];
  const outputs = data.portsSnapshot?.filter((port) => port.direction === 'output') ?? [];

  return (
    <div className="workflow-node disabled-core-node">
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label || 'Disabled Node'}</strong>
      </div>
      <span className="node-description">{data.description || data.nodeType}</span>
      <p className="disabled-core-node-note">Node type disabled: {data.nodeType}</p>
      <div className="disabled-core-node-ports">
        {inputs.map((port) => (
          <div className="workflow-port workflow-port-input" key={`input-${port.id}`}>
            <Handle id={port.id} type="target" position={Position.Left} />
            <span>{port.label}</span>
          </div>
        ))}
        {outputs.map((port) => (
          <div className="workflow-port workflow-port-output" key={`output-${port.id}`}>
            <span>{port.label}</span>
            <Handle id={port.id} type="source" position={Position.Right} />
          </div>
        ))}
      </div>
      <p className="disabled-core-node-hint">
        Re-enable this type in the Node Manager and reload the workflow to restore it.
      </p>
    </div>
  );
}
