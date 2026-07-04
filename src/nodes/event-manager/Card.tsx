import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { StatLine } from '../../components/StatLine';
import { useBackdropDismiss } from '../../components/useBackdropDismiss';
import { upcomingAppointments } from '../../data-management/eventStore';
import type { WorkflowNode } from '../../types';
import {
  defaultEventManagerPromptText,
  eventManagerPromptSettings,
  eventManagerPromptVariables,
} from './prompt';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { ConnectionSelect } from '../shared/ConnectionSelect';
import { LlmCallMetrics, runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';
import { PostOutputToggle } from '../shared/PostOutputToggle';
import {
  promptPresetDisplayText,
  promptPresetSource,
  promptSettingForSource,
  type PromptPresetSource,
} from '../shared/promptPresets';

function EventManagerPromptTextarea({
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

export function EventManagerNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const actions = useNodeActions();
  const view = useNodeView();
  const { estimatedTokenBytesPerToken } = view;
  const [showEventManagerPrompt, setShowEventManagerPrompt] = useState(false);
  const promptBackdropDismiss = useBackdropDismiss<HTMLDivElement>(() => setShowEventManagerPrompt(false));
  const [workflowPromptText, setWorkflowPromptText] = useState<string | undefined>();
  const eventPrompt = eventManagerPromptSettings(data.eventManagerPrompt);
  const eventPromptPresetKey = 'event-manager.prompt';
  const localEventPromptText = view.promptTextCustomPresets[eventPromptPresetKey];
  const eventPromptSource = promptPresetSource(
    eventPrompt,
    defaultEventManagerPromptText,
    localEventPromptText,
  );
  const eventPromptText = promptPresetDisplayText(
    eventPromptSource,
    eventPrompt,
    defaultEventManagerPromptText,
    localEventPromptText,
  );
  const effectiveWorkflowPromptText = workflowPromptText ?? (
    eventPromptSource === 'workflow' ? eventPrompt.customText : undefined
  );
  const updateEventManagerPrompt = (patch: Partial<typeof eventPrompt>) => {
    actions.updateData(id, {
      eventManagerPrompt: {
        ...eventPrompt,
        ...patch,
      },
    });
  };
  const saveLocalEventPrompt = (value: string) => {
    view.setPromptTextCustomPresets((current) => ({
      ...current,
      [eventPromptPresetKey]: value,
    }));
  };
  const switchEventPromptSource = (source: PromptPresetSource) => {
    if (eventPromptSource === 'workflow' && eventPrompt.customText) {
      setWorkflowPromptText(eventPrompt.customText);
    }
    const next = promptSettingForSource(
      source,
      eventPromptText,
      defaultEventManagerPromptText,
      localEventPromptText,
      effectiveWorkflowPromptText,
    );
    if (source === 'custom') {
      saveLocalEventPrompt(next.customText ?? defaultEventManagerPromptText);
    }
    updateEventManagerPrompt(next);
  };
  const upcomingEvents = upcomingAppointments(data.eventAppointments ?? []).length;
  return (
    <div className={`workflow-node history-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <LlmCallMetrics data={data} />
      <span className="node-description">{data.description}</span>
      <ConnectionSelect id={id} label="EVENT LLM" connectionId={data.connectionId} />
      <PostOutputToggle id={id} enabled={data.runAfterRpOutput} />
      <div className="history-time-summary">
        <span>{data.eventStatus ?? 'Waiting for event update'}</span>
        <small>{upcomingEvents} upcoming events</small>
      </div>
      <div className="node-metrics history-metrics">
        <StatLine label="Context" text={data.fullText ?? ''} bytesPerEstimatedToken={estimatedTokenBytesPerToken} />
      </div>
      <div className="history-ports">
        <div className="history-port history-port-input">
          <PortLabel data={data} direction="input" label="Event Context" valueType="text" />
          <Handle id="default" type="target" position={Position.Left} />
        </div>
        <div className="history-port history-port-output optional">
          <PortLabel data={data} direction="output" handle="appointments" label="Events" valueType="text" />
          <Handle id="appointments" type="source" position={Position.Right} />
        </div>
      </div>
      <div className="node-actions history-actions">
        <button
          className="inspect-button nodrag"
          type="button"
          disabled={!data.eventLastResponse}
          onClick={() => actions.showEventManagerResponse(id)}
        >
          Events LLM Output
        </button>
        <button className="inspect-button nodrag" type="button" onClick={() => actions.showEventManagerAppointments(id)}>
          Events
        </button>
        <button className="inspect-button nodrag" type="button" onClick={() => actions.textPreview(id)}>
          Text Preview
        </button>
        <button className="inspect-button nodrag" type="button" onClick={() => setShowEventManagerPrompt(true)}>
          Event Manager Prompt
        </button>
      </div>
      {showEventManagerPrompt && typeof document !== 'undefined' && createPortal(
        <div className="dialog-backdrop" {...promptBackdropDismiss}>
          <section
            className="autoturn-instructions-dialog nodrag"
            role="dialog"
            aria-modal="true"
            aria-label="Event Manager Prompt"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-title-row">
              <div>
                <span className="eyebrow">EVENT MANAGER</span>
                <h2>Event Manager Prompt</h2>
              </div>
              <button type="button" onClick={() => setShowEventManagerPrompt(false)}>
                Close
              </button>
            </div>
            <div className="event-manager-prompt-body">
              <section className="event-manager-prompt-editor">
                <div className="event-manager-prompt-toolbar">
                  <div className="autoturn-instruction-mode" role="group" aria-label="Event Manager Prompt mode">
                    <button
                      type="button"
                      className={eventPromptSource === 'default' ? 'active' : ''}
                      onClick={() => switchEventPromptSource('default')}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      className={eventPromptSource === 'custom' ? 'active' : ''}
                      onClick={() => switchEventPromptSource('custom')}
                    >
                      Custom
                    </button>
                    <button
                      type="button"
                      className={eventPromptSource === 'workflow' ? 'active' : ''}
                      disabled={!effectiveWorkflowPromptText}
                      onClick={() => switchEventPromptSource('workflow')}
                    >
                      In Workflow
                    </button>
                  </div>
                  <div className="event-manager-prompt-heading">
                    <h3>Event Manager Prompt</h3>
                  </div>
                </div>
                <div className="event-manager-prompt-variables" aria-label="Event Manager Prompt variables">
                  {eventManagerPromptVariables.map((variable) => (
                    <span key={variable}>{variable}</span>
                  ))}
                </div>
                <EventManagerPromptTextarea
                  value={eventPromptText}
                  disabled={eventPromptSource === 'default'}
                  onChange={(value) => {
                    if (eventPromptSource === 'custom') {
                      saveLocalEventPrompt(value);
                    }
                    updateEventManagerPrompt({
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
