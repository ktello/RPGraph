import { Handle, Position, type NodeProps } from '@xyflow/react';
import { StatLine } from '../../components/StatLine';
import type { WorkflowNode } from '../../types';
import {
  maximumTextRouterNumberOutputs,
  minimumTextRouterNumberOutputs,
  textRouterMode,
  textRouterNumberOutputCount,
  textRouterNumberOutputHandle,
} from '../../workflow';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';

export function PhoneMessageRouterNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { changeTextRouterMode, changeTextRouterNumberOutputCount, textPreview } = useNodeActions();
  const { estimatedTokenBytesPerToken } = useNodeView();
  const mode = textRouterMode(data);
  const numberOutputCount = textRouterNumberOutputCount(data);

  return (
    <div className={`workflow-node phone-router-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <div className="text-router-mode" role="radiogroup" aria-label="Text Router mode">
        <label className="option-toggle compact-toggle">
          <input
            className="nodrag"
            type="radio"
            name={`${id}-text-router-mode`}
            checked={mode === 'bool'}
            onChange={() => changeTextRouterMode(id, 'bool')}
          />
          <span>Bool</span>
        </label>
        <label className="option-toggle compact-toggle">
          <input
            className="nodrag"
            type="radio"
            name={`${id}-text-router-mode`}
            checked={mode === 'number'}
            onChange={() => changeTextRouterMode(id, 'number')}
          />
          <span>Number</span>
        </label>
        {mode === 'number' && (
          <div className="combiner-count-controls">
            <button
              className="combiner-count-button nodrag"
              type="button"
              disabled={numberOutputCount <= minimumTextRouterNumberOutputs}
              onClick={() => changeTextRouterNumberOutputCount(id, -1)}
              aria-label="Remove number route"
            >
              -
            </button>
            <button
              className="combiner-count-button nodrag"
              type="button"
              disabled={numberOutputCount >= maximumTextRouterNumberOutputs}
              onClick={() => changeTextRouterNumberOutputCount(id, 1)}
              aria-label="Add number route"
            >
              +
            </button>
          </div>
        )}
      </div>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-input">
          <Handle id="text" type="target" position={Position.Left} />
          <PortLabel data={data} direction="input" handle="text" label="Text Input" valueType="text" />
        </div>
        <div className="workflow-port workflow-port-input">
          <Handle id="condition" type="target" position={Position.Left} />
          <PortLabel data={data} direction="input" handle="condition" label={mode === 'number' ? 'Number' : 'Bool'} valueType={mode === 'number' ? 'number' : 'boolean'} />
        </div>
        {mode === 'number'
          ? Array.from({ length: numberOutputCount }, (_, index) => (
              <div className="workflow-port workflow-port-output" key={textRouterNumberOutputHandle(index)}>
                <PortLabel data={data} direction="output" handle={textRouterNumberOutputHandle(index)} label={`Number ${index} Text`} valueType="text" />
                <Handle id={textRouterNumberOutputHandle(index)} type="source" position={Position.Right} />
              </div>
            ))
          : (
              <>
                <div className="workflow-port workflow-port-output">
                  <PortLabel data={data} direction="output" handle="false" label="False Text" valueType="text" />
                  <Handle id="false" type="source" position={Position.Right} />
                </div>
                <div className="workflow-port workflow-port-output">
                  <PortLabel data={data} direction="output" handle="true" label="True Text" valueType="text" />
                  <Handle id="true" type="source" position={Position.Right} />
                </div>
              </>
            )}
      </div>
      <span className="node-field-label metric-label">LAST ROUTE TOKEN STATS</span>
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
