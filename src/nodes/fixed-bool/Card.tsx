import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { useNodeActions } from '../NodeActionsContext';
import { runStateClassName } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';

export function FixedBoolNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const { changeFixedBoolValue } = useNodeActions();
  const value = data.fixedBoolValue ?? false;
  return (
    <div className={`workflow-node fixed-number-node${runStateClassName(data)}`}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <span className="node-field-label">FIXED BOOL</span>
      <div className="text-router-mode fixed-bool-mode" role="radiogroup" aria-label="Fixed Bool value">
        <label className="option-toggle compact-toggle">
          <input
            className="nodrag"
            type="radio"
            name={`${id}-fixed-bool`}
            checked={!value}
            onChange={() => changeFixedBoolValue(id, false)}
          />
          <span>False</span>
        </label>
        <label className="option-toggle compact-toggle">
          <input
            className="nodrag"
            type="radio"
            name={`${id}-fixed-bool`}
            checked={value}
            onChange={() => changeFixedBoolValue(id, true)}
          />
          <span>True</span>
        </label>
      </div>
      <span className="run-note fixed-number-note">Connect to a bool input port</span>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-output">
          <PortLabel data={data} direction="output" label="Bool" valueType="boolean" />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
