import { Handle, Position, type NodeProps } from '@xyflow/react';
import { StatLine } from '../../components/StatLine';
import type { WorkflowNode } from '../../types';
import {
  maximumTextRouterNumberOutputs,
  minimumTextRouterNumberOutputs,
  textSelectorInputCount,
  textSelectorMode,
  textSelectorTextInputHandle,
} from '../../workflow';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';

export function TextSelectorNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { changeTextSelectorInputCount, changeTextSelectorMode, textPreview } = useNodeActions();
  const { estimatedTokenBytesPerToken } = useNodeView();
  const mode = textSelectorMode(data);
  const inputCount = textSelectorInputCount(data);

  return (
    <div className={`workflow-node phone-router-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <div className="text-router-mode" role="radiogroup" aria-label="Text Selector mode">
        <label className="option-toggle compact-toggle">
          <input
            className="nodrag"
            type="radio"
            name={`${id}-text-selector-mode`}
            checked={mode === 'bool'}
            onChange={() => changeTextSelectorMode(id, 'bool')}
          />
          <span>Bool</span>
        </label>
        <label className="option-toggle compact-toggle">
          <input
            className="nodrag"
            type="radio"
            name={`${id}-text-selector-mode`}
            checked={mode === 'number'}
            onChange={() => changeTextSelectorMode(id, 'number')}
          />
          <span>Number</span>
        </label>
        {mode === 'number' && (
          <div className="combiner-count-controls">
            <button
              className="combiner-count-button nodrag"
              type="button"
              disabled={inputCount <= minimumTextRouterNumberOutputs}
              onClick={() => changeTextSelectorInputCount(id, -1)}
              aria-label="Remove text input"
            >
              -
            </button>
            <button
              className="combiner-count-button nodrag"
              type="button"
              disabled={inputCount >= maximumTextRouterNumberOutputs}
              onClick={() => changeTextSelectorInputCount(id, 1)}
              aria-label="Add text input"
            >
              +
            </button>
          </div>
        )}
      </div>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-input">
          <Handle id="condition" type="target" position={Position.Left} />
          <PortLabel data={data} direction="input" handle="condition" label={mode === 'number' ? 'Select Number' : 'Bool'} valueType={mode === 'number' ? 'number' : 'boolean'} />
        </div>
        {mode === 'number'
          ? Array.from({ length: inputCount }, (_, index) => (
              <div className="workflow-port workflow-port-input" key={textSelectorTextInputHandle(index)}>
                <Handle id={textSelectorTextInputHandle(index)} type="target" position={Position.Left} />
                <PortLabel data={data} direction="input" handle={textSelectorTextInputHandle(index)} label={`Number ${index} Text`} valueType="text" />
              </div>
            ))
          : (
              <>
                <div className="workflow-port workflow-port-input">
                  <Handle id="false" type="target" position={Position.Left} />
                  <PortLabel data={data} direction="input" handle="false" label="False Text" valueType="text" />
                </div>
                <div className="workflow-port workflow-port-input">
                  <Handle id="true" type="target" position={Position.Left} />
                  <PortLabel data={data} direction="input" handle="true" label="True Text" valueType="text" />
                </div>
              </>
            )}
        <div className="workflow-port workflow-port-output">
          <PortLabel data={data} direction="output" label="Text" valueType="text" />
          <Handle type="source" position={Position.Right} />
        </div>
      </div>
      <span className="node-field-label metric-label">LAST SELECTION TOKEN STATS</span>
      <div className="node-metrics">
        <StatLine text={data.fullText ?? ''} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
      </div>
      <div className="node-actions">
        <span className="run-note">{data.preview}</span>
        <button className="inspect-button nodrag" type="button" onClick={() => textPreview(id)}>
          Text Preview
        </button>
      </div>
    </div>
  );
}
