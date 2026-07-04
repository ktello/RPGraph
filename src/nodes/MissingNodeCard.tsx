import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../types';

export function MissingNodeCard({ data }: NodeProps<WorkflowNode>) {
  const inputs = data.portsSnapshot?.filter((port) => port.direction === 'input') ?? [];
  const outputs = data.portsSnapshot?.filter((port) => port.direction === 'output') ?? [];

  return (
    <div className="workflow-node missing-node">
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label || 'Missing Node'}</strong>
      </div>
      <span className="node-description">{data.description || data.nodeType}</span>
      <p className="missing-node-note">Plugin not installed: {data.nodeType}</p>
      <div className="missing-node-ports">
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
    </div>
  );
}
