import { Handle, NodeResizeControl, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { useNodeActions } from '../NodeActionsContext';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { JsonSyntaxTextarea } from '../shared/JsonSyntaxTextarea';
import { PortLabel } from '../shared/PortValue';

export function LoadTextNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const actions = useNodeActions();
  const wrapPreview = data.loadTextWrapPreview ?? true;
  return (
    <div className={`workflow-node load-text-node${wrapPreview ? ' load-text-wrap-preview' : ''}${runStateClassName(data)}`} ref={nodeBodyRef}>
      <NodeResizeControl className="load-text-resize-control" minHeight={270} minWidth={300} />
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <button className="load-text-button nodrag" type="button" onClick={() => void actions.loadTextFile(id)}>
        Open Text File
      </button>
      <label className="node-field-label" htmlFor={`${id}-text-preview`}>
        TEXT PREVIEW
      </label>
      <label className="node-toggle post-output-toggle load-text-wrap-toggle nodrag">
        <input
          className="nodrag nowheel"
          type="checkbox"
          checked={wrapPreview}
          onChange={(event) => actions.updateData(id, { loadTextWrapPreview: event.currentTarget.checked })}
        />
        Wrap long lines
      </label>
      <JsonSyntaxTextarea
        className="node-textarea write-text-editor load-text-preview nodrag nowheel"
        id={`${id}-text-preview`}
        value={data.loadedText ?? ''}
        placeholder="Open a .txt, .json, .md, .csv or another text-based file ..."
        readOnly
        wrap={wrapPreview ? 'soft' : 'off'}
      />
      <div className="node-actions load-text-actions">
        <span className="run-note" title={data.loadedFileName ?? data.preview}>
          {data.loadedFileName ?? data.preview}
        </span>
        <button
          className="inspect-button nodrag"
          type="button"
          disabled={!data.loadedFileName}
          onClick={() => actions.textPreview(id)}
        >
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
