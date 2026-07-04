import { Handle, Position, type NodeProps } from '@xyflow/react';
import { StatLine } from '../../components/StatLine';
import type { WorkflowNode } from '../../types';
import {
  combineTextInputs,
  combinerInputCount,
  combinerInputHandle,
  combinerInputLabel,
  combinerPrefixes,
  combinerPreviews,
  maximumCombinerInputs,
  minimumCombinerInputs,
} from '../../workflow';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';

export function CombinerNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { changeCombinerInputCount, changeCombinerPrefix, textPreview } = useNodeActions();
  const { estimatedTokenBytesPerToken } = useNodeView();
  const inputCount = combinerInputCount(data);
  const prefixes = combinerPrefixes(data);
  const inputPreviews = combinerPreviews(data);
  const combinedText = combineTextInputs(prefixes, inputPreviews);

  return (
    <div className={`workflow-node combiner-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
        <div className="combiner-count-controls">
          <button className="combiner-count-button nodrag" type="button" disabled={inputCount <= minimumCombinerInputs} onClick={() => changeCombinerInputCount(id, -1)} aria-label="Remove text input">
            -
          </button>
          <button className="combiner-count-button nodrag" type="button" disabled={inputCount >= maximumCombinerInputs} onClick={() => changeCombinerInputCount(id, 1)} aria-label="Add text input">
            +
          </button>
        </div>
      </div>
      <span className="node-description">{data.description}</span>
      <div className="combiner-inputs">
        {prefixes.map((prefix, index) => (
          <div className="combiner-input" key={combinerInputHandle(index)}>
            <label className="node-field-label" htmlFor={`${id}-prefix-${index}`}>
              TEXT BEFORE INPUT {combinerInputLabel(index)}
            </label>
            <textarea className="node-textarea combiner-prefix nodrag nowheel" id={`${id}-prefix-${index}`} rows={2} value={prefix} onChange={(event) => changeCombinerPrefix(id, index, event.target.value)} />
            <div className="combiner-port">
              <Handle id={combinerInputHandle(index)} type="target" position={Position.Left} />
              <StatLine label={`Input ${combinerInputLabel(index)}`} text={inputPreviews[index]} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
            </div>
          </div>
        ))}
      </div>
      <span className="node-field-label metric-label">TOTAL TOKEN STATS</span>
      <div className="node-metrics combiner-total">
        <StatLine text={combinedText} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
      </div>
      <div className="node-actions">
        <span className="run-note">{data.preview}</span>
        <button className="inspect-button nodrag" type="button" onClick={() => textPreview(id, combinedText)}>
          Text Preview
        </button>
      </div>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-output">
          <span>Text</span>
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
