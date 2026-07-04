import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { StatLine } from '../../components/StatLine';
import { useBackdropDismiss } from '../../components/useBackdropDismiss';
import type { WorkflowNode } from '../../types';
import {
  defaultHistoryRpTimePromptText,
  historyRpTimePromptSettings,
  historyRpTimePromptVariables,
} from './rpTimePrompt';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { ConnectionSelect } from '../shared/ConnectionSelect';
import { LlmCallMetrics, runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';
import { PostOutputToggle } from '../shared/PostOutputToggle';
import { sanitizeDataUrlsInText } from '../../utils/sanitize';
import {
  promptPresetDisplayText,
  promptPresetSource,
  promptSettingForSource,
  type PromptPresetSource,
} from '../shared/promptPresets';

function HistoryRpTimePromptTextarea({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 20;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + lineHeight}px`;
  }, [value, disabled]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      disabled={disabled}
      spellCheck={false}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}

export function HistoryNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const actions = useNodeActions();
  const view = useNodeView();
  const { estimatedTokenBytesPerToken } = view;
  const [showRpTimePrompt, setShowRpTimePrompt] = useState(false);
  const rpTimeBackdropDismiss = useBackdropDismiss<HTMLDivElement>(() => setShowRpTimePrompt(false));
  const [workflowPromptText, setWorkflowPromptText] = useState<string | undefined>();
  const rpTimePrompt = historyRpTimePromptSettings(data.historyRpTimePrompt);
  const rpTimePromptPresetKey = 'history.rp-time-prompt';
  const localRpTimePromptText = view.promptTextCustomPresets[rpTimePromptPresetKey];
  const rpTimePromptSource = promptPresetSource(
    rpTimePrompt,
    defaultHistoryRpTimePromptText,
    localRpTimePromptText,
  );
  const rpTimePromptText = promptPresetDisplayText(
    rpTimePromptSource,
    rpTimePrompt,
    defaultHistoryRpTimePromptText,
    localRpTimePromptText,
  );
  const effectiveWorkflowPromptText = workflowPromptText ?? (
    rpTimePromptSource === 'workflow' ? rpTimePrompt.customText : undefined
  );
  const updateRpTimePrompt = (patch: Partial<typeof rpTimePrompt>) => {
    actions.updateData(id, {
      historyRpTimePrompt: {
        ...rpTimePrompt,
        ...patch,
      },
    });
  };
  const saveLocalRpTimePrompt = (value: string) => {
    view.setPromptTextCustomPresets((current) => ({
      ...current,
      [rpTimePromptPresetKey]: value,
    }));
  };
  const switchRpTimePromptSource = (source: PromptPresetSource) => {
    if (rpTimePromptSource === 'workflow' && rpTimePrompt.customText) {
      setWorkflowPromptText(rpTimePrompt.customText);
    }
    const next = promptSettingForSource(
      source,
      rpTimePromptText,
      defaultHistoryRpTimePromptText,
      localRpTimePromptText,
      effectiveWorkflowPromptText,
    );
    if (source === 'custom') {
      saveLocalRpTimePrompt(next.customText ?? defaultHistoryRpTimePromptText);
    }
    updateRpTimePrompt(next);
  };
  return (
    <div className={`workflow-node history-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <LlmCallMetrics data={data} />
      <span className="node-description">{data.description}</span>
      <label className="node-toggle nodrag">
        <input
          className="nodrag nowheel"
          type="checkbox"
          checked={data.historyTimeTrackingEnabled ?? false}
          onChange={(event) => actions.updateData(id, {
            historyTimeTrackingEnabled: event.target.checked,
            historyTimeStatus: event.target.checked ? 'Waiting for RP time update' : 'RP Time: Disabled',
          })}
        />
        Enable RP time tracking
      </label>
      {data.historyTimeTrackingEnabled && (
        <>
          <ConnectionSelect id={id} label="HISTORY LLM" connectionId={data.connectionId} />
          <PostOutputToggle id={id} enabled={data.runAfterRpOutput} />
        </>
      )}
      <label className="node-field-label" htmlFor={`${id}-last-turns`}>
        Last Turns Output
      </label>
      <input
        id={`${id}-last-turns`}
        className="node-number-input nodrag nowheel"
        type="number"
        min={1}
        max={100}
        step={1}
        value={data.historyLastTurnsCount ?? 5}
        onChange={(event) => actions.updateData(id, { historyLastTurnsCount: Number(event.target.value) })}
      />
      {data.historyTimeTrackingEnabled && (
        <>
          <div className="history-time-summary">
            <span>{data.historyTimeStatus ?? 'Waiting for RP time update'}</span>
          </div>
        </>
      )}
      <div className="node-metrics history-metrics">
        <StatLine label="Raw" text={sanitizeDataUrlsInText(data.rawHistory ?? '')} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
        <StatLine label="Formatted" text={data.originalHistory ?? ''} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
        <StatLine label="Last X" text={data.lastTurnsHistory ?? ''} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
      </div>
      <div className="history-ports">
        <div className="history-port history-port-output">
          <PortLabel data={data} direction="output" handle="original" label="1. Formatted Chat History" valueType="text" />
          <Handle id="original" type="source" position={Position.Right} />
        </div>
        <div className="history-port history-port-output">
          <PortLabel data={data} direction="output" handle="last-turns" label="2. Last X Turns" valueType="text" />
          <Handle id="last-turns" type="source" position={Position.Right} />
        </div>
      </div>
      <div className="node-actions history-actions">
        {data.historyTimeTrackingEnabled && (
          <button
            className="inspect-button nodrag"
            type="button"
            disabled={!data.historyLastResponse}
            onClick={() => actions.showHistoryTimeResponse(id)}
          >
            Time LLM Output
          </button>
        )}
        <button className="inspect-button nodrag" type="button" onClick={() => actions.textPreview(id)}>
          Text Preview
        </button>
        {data.historyTimeTrackingEnabled && (
          <button className="inspect-button nodrag" type="button" onClick={() => setShowRpTimePrompt(true)}>
            RP Time Prompt
          </button>
        )}
      </div>
      {showRpTimePrompt && typeof document !== 'undefined' && createPortal(
        <div className="dialog-backdrop" {...rpTimeBackdropDismiss}>
          <section
            className="autoturn-instructions-dialog nodrag"
            role="dialog"
            aria-modal="true"
            aria-label="RP Time Prompt"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-title-row">
              <div>
                <span className="eyebrow">CHAT HISTORY</span>
                <h2>RP Time Prompt</h2>
              </div>
              <button type="button" onClick={() => setShowRpTimePrompt(false)}>
                Close
              </button>
            </div>
            <div className="event-manager-prompt-body">
              <section className="event-manager-prompt-editor">
                <div className="event-manager-prompt-toolbar">
                  <div className="autoturn-instruction-mode" role="group" aria-label="RP Time Prompt mode">
                    <button
                      type="button"
                      className={rpTimePromptSource === 'default' ? 'active' : ''}
                      onClick={() => switchRpTimePromptSource('default')}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      className={rpTimePromptSource === 'custom' ? 'active' : ''}
                      onClick={() => switchRpTimePromptSource('custom')}
                    >
                      Custom
                    </button>
                    <button
                      type="button"
                      className={rpTimePromptSource === 'workflow' ? 'active' : ''}
                      disabled={!effectiveWorkflowPromptText}
                      onClick={() => switchRpTimePromptSource('workflow')}
                    >
                      In Workflow
                    </button>
                  </div>
                  <div className="event-manager-prompt-heading">
                    <h3>RP Time Prompt</h3>
                  </div>
                </div>
                <div className="event-manager-prompt-variables" aria-label="RP Time Prompt variables">
                  {historyRpTimePromptVariables.map((variable) => (
                    <span key={variable}>{variable}</span>
                  ))}
                </div>
                <HistoryRpTimePromptTextarea
                  value={rpTimePromptText}
                  disabled={rpTimePromptSource === 'default'}
                  onChange={(value) => {
                    if (rpTimePromptSource === 'custom') {
                      saveLocalRpTimePrompt(value);
                    }
                    updateRpTimePrompt({
                      mode: 'custom',
                      customText: value,
                    });
                  }}
                />
              </section>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
