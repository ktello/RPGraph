import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import {
  llmDecisionEntries,
  llmDecisionOutputHandle,
  maximumLlmDecisionQuestions,
  minimumLlmDecisionQuestions,
} from '../../workflow';
import { useNodeActions } from '../NodeActionsContext';
import { ConnectionSelect } from '../shared/ConnectionSelect';
import { LlmCallMetrics, runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';
import { PostOutputToggle } from '../shared/PostOutputToggle';

export function LlmDecisionNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const actions = useNodeActions();
  const nodeBodyRef = useNodeLayoutSync(id);
  const entries = llmDecisionEntries(data);

  return (
    <div className={`workflow-node llm-decision-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
        <div className="combiner-count-controls">
          <button
            className="combiner-count-button nodrag"
            type="button"
            disabled={entries.length <= minimumLlmDecisionQuestions}
            onClick={() => actions.changeLlmDecisionQuestionCount(id, -1)}
            aria-label="Remove question"
          >
            -
          </button>
          <button
            className="combiner-count-button nodrag"
            type="button"
            disabled={entries.length >= maximumLlmDecisionQuestions}
            onClick={() => actions.changeLlmDecisionQuestionCount(id, 1)}
            aria-label="Add question"
          >
            +
          </button>
        </div>
      </div>
      <LlmCallMetrics data={data} />
      <span className="node-description">{data.description}</span>
      <ConnectionSelect id={id} label="DECISION LLM" connectionId={data.connectionId} />
      <PostOutputToggle id={id} enabled={data.runAfterRpOutput} />
      <div className="workflow-ports llm-decision-input">
        <div className="workflow-port workflow-port-input">
          <Handle type="target" position={Position.Left} />
          <PortLabel data={data} direction="input" label="Text Input" valueType="text" />
        </div>
        <div className="workflow-port workflow-port-input">
          <Handle id="image" type="target" position={Position.Left} />
          <PortLabel data={data} direction="input" handle="image" label="Image Input" valueType="image" />
        </div>
      </div>
      <div className="llm-decision-questions">
        {entries.map((entry) => (
          <div className="llm-decision-question" key={entry.index}>
            <label className="node-field-label" htmlFor={`${id}-decision-${entry.index}`}>
              QUESTION {entry.index + 1}
            </label>
            <textarea
              className="node-textarea llm-decision-prompt nodrag nowheel"
              id={`${id}-decision-${entry.index}`}
              rows={3}
              value={entry.question}
              onChange={(event) =>
                actions.changeLlmDecisionQuestion(id, entry.index, event.target.value)
              }
            />
            <div className="llm-decision-output-toggles">
              {(['bool', 'text', 'number'] as const).map((kind) => (
                <label className="option-toggle compact-toggle" key={kind}>
                  <input
                    type="checkbox"
                    checked={entry.outputs[kind]}
                    onChange={(event) =>
                      actions.changeLlmDecisionOutput(id, entry.index, kind, event.target.checked)
                    }
                  />
                  <span>{kind === 'bool' ? 'Bool' : kind === 'text' ? 'Text' : 'Number'}</span>
                </label>
              ))}
            </div>
            <div className="llm-decision-outputs">
              {entry.outputs.bool && (
                <div className="workflow-port workflow-port-output">
                  <PortLabel data={data} direction="output" handle={llmDecisionOutputHandle(entry.index, 'bool')} label={`Bool ${entry.index + 1}`} valueType="boolean" />
                  <Handle id={llmDecisionOutputHandle(entry.index, 'bool')} type="source" position={Position.Right} />
                </div>
              )}
              {entry.outputs.text && (
                <div className="workflow-port workflow-port-output">
                  <PortLabel data={data} direction="output" handle={llmDecisionOutputHandle(entry.index, 'text')} label={`Text ${entry.index + 1}`} valueType="text" />
                  <Handle id={llmDecisionOutputHandle(entry.index, 'text')} type="source" position={Position.Right} />
                </div>
              )}
              {entry.outputs.number && (
                <div className="workflow-port workflow-port-output">
                  <PortLabel data={data} direction="output" handle={llmDecisionOutputHandle(entry.index, 'number')} label={`Number ${entry.index + 1}`} valueType="number" />
                  <Handle id={llmDecisionOutputHandle(entry.index, 'number')} type="source" position={Position.Right} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="node-actions">
        <span className="run-note">{data.preview}</span>
        <button className="inspect-button nodrag" type="button" disabled={!data.fullText} onClick={() => actions.textPreview(id)}>
          Text Preview
        </button>
      </div>
    </div>
  );
}
