import { Handle, Position, type NodeProps } from '@xyflow/react';
import { StatLine } from '../../components/StatLine';
import type { WorkflowNode } from '../../types';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';

export function LastRpOutputNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { textPreview, updateData } = useNodeActions();
  const { estimatedTokenBytesPerToken } = useNodeView();

  return (
    <div className={`workflow-node last-message-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <label className="node-toggle nodrag">
        <input
          className="nodrag nowheel"
          type="checkbox"
          checked={data.includeRpDateTime ?? false}
          onChange={(event) => updateData(id, { includeRpDateTime: event.target.checked })}
        />
        Show RP timestamp
      </label>
      <div className="node-metrics history-metrics">
        <StatLine text={data.fullText ?? data.preview} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
      </div>
      <div className="node-actions history-actions">
        <span className="run-note">{data.preview}</span>
        <button className="inspect-button nodrag" type="button" onClick={() => textPreview(id)}>
          Text Preview
        </button>
      </div>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-output">
          <PortLabel data={data} direction="output" label="Text" valueType="text" />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
