import { Handle, NodeResizeControl, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { JsonSyntaxTextarea, formatJsonTextSegments } from '../shared/JsonSyntaxTextarea';
import { PortLabel } from '../shared/PortValue';

export function WriteTextNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { changeWriteTextValue } = useNodeActions();
  const view = useNodeView();
  const formatJson = () => {
    try {
      changeWriteTextValue(id, formatJsonTextSegments(data.writeTextValue ?? ''));
    } catch {
      // Leave non-JSON text untouched; Write Text is intentionally generic.
    }
  };

  return (
    <div className={`workflow-node write-text-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <NodeResizeControl
        className="write-text-resize-control"
        minHeight={265}
        minWidth={365}
      />
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <div className="write-text-label-row">
        <label className="node-field-label" htmlFor={`${id}-text`}>
          TEXT
        </label>
        <button className="inspect-button write-text-format-button nodrag" type="button" onClick={formatJson}>
          Format JSON
        </button>
      </div>
      <JsonSyntaxTextarea
        className="node-textarea write-text-editor nodrag nowheel"
        id={`${id}-text`}
        rows={6}
        value={data.writeTextValue ?? ''}
        onChange={(value) => changeWriteTextValue(id, value)}
        workflowVariableDefinitions={view.settingsValueDefinitions}
        workflowVariableValues={view.settingsValues}
      />
      <span className="run-note fixed-number-note">Connect to a text input port</span>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-output">
          <PortLabel data={data} direction="output" label="Text" valueType="text" />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
