import { Handle, NodeResizeControl, Position, type NodeProps } from '@xyflow/react';
import { StatLine } from '../../components/StatLine';
import type { WorkflowNode } from '../../types';
import { useNodeView } from '../NodeViewContext';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { HighlightedPreviewText } from '../shared/HighlightedPreviewText';
import { PortLabel } from '../shared/PortValue';

export function TextPreviewNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { estimatedTokenBytesPerToken } = useNodeView();
  const displayedText = data.fullText ?? '';
  return (
    <div className={`workflow-node text-preview-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <NodeResizeControl className="text-preview-resize-control" minHeight={250} minWidth={300} />
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-input">
          <Handle type="target" position={Position.Left} />
          <PortLabel data={data} direction="input" label="Mixed Input" valueType="mixed" />
        </div>
        <div className="workflow-port workflow-port-output">
          <PortLabel data={data} direction="output" label="Mixed" valueType="mixed" />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
      <span className="node-field-label metric-label">CONTEXT TOKEN ESTIMATE</span>
      <div className="node-metrics">
        <StatLine text={displayedText} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
      </div>
      <label className="node-field-label" htmlFor={`${id}-shown-text`}>
        TEXT
      </label>
      {displayedText ? (
        <HighlightedPreviewText
          chatHistory="auto"
          className="node-textarea text-preview-preview nodrag nowheel"
          text={displayedText}
        />
      ) : (
        <textarea
          className="node-textarea text-preview-preview nodrag nowheel"
          id={`${id}-shown-text`}
          value={displayedText}
          placeholder="Connect text and run the workflow ..."
          readOnly
          spellCheck={false}
        />
      )}
      <span className="run-note text-preview-status">{data.preview}</span>
    </div>
  );
}
