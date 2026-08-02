import { Handle, Position } from '@xyflow/react';
import type { ReactNode } from 'react';
import type { WorkflowNodeData } from '../types';

type PlaceholderNodeCardProps = {
  data: WorkflowNodeData;
  classPrefix: string;
  fallbackTitle: string;
  note: ReactNode;
  hint?: ReactNode;
};

// Shared inert placeholder card for node types that cannot render normally
// (disabled in the Node Manager, or from a plugin that is not installed).
// Renders the stored ports so connected edges stay attached; the node's
// original data is preserved for when the type becomes available again.
export function PlaceholderNodeCard({ data, classPrefix, fallbackTitle, note, hint }: PlaceholderNodeCardProps) {
  const inputs = data.portsSnapshot?.filter((port) => port.direction === 'input') ?? [];
  const outputs = data.portsSnapshot?.filter((port) => port.direction === 'output') ?? [];

  return (
    <div className={`workflow-node ${classPrefix}`}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label || fallbackTitle}</strong>
      </div>
      <span className="node-description">{data.description || data.nodeType}</span>
      <p className={`${classPrefix}-note`}>{note}</p>
      <div className={`${classPrefix}-ports`}>
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
      {hint !== undefined && <p className={`${classPrefix}-hint`}>{hint}</p>}
    </div>
  );
}
