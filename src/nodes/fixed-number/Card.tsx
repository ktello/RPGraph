import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { defaultContextCompressionTokenLimit } from '../../workflow';
import { useNodeActions } from '../NodeActionsContext';
import { runStateClassName } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';

export function FixedNumberNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const { changeFixedNumberValue } = useNodeActions();
  const value = String(data.fixedNumberValue ?? defaultContextCompressionTokenLimit);
  return (
    <div className={`workflow-node fixed-number-node${runStateClassName(data)}`}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <label className="node-field-label" htmlFor={`${id}-value`}>
        FIXED NUMBER
      </label>
      <input
        className="node-number-input nodrag nowheel"
        id={`${id}-value`}
        type="text"
        step={1}
        value={value}
        onChange={(event) => changeFixedNumberValue(id, event.target.value)}
      />
      <span className="run-note fixed-number-note">Connect to a numeric input port</span>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-output">
          <PortLabel data={data} direction="output" label="Number" valueType="number" />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
