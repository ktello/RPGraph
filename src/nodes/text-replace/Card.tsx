import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import {
  textReplaceEntries,
  textReplaceReplacementEntryId,
  textReplaceReplacementHandle,
} from '../../workflow';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { PortLabel } from '../shared/PortValue';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';

export function TextReplaceNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { addTextReplaceEntry, removeTextReplaceEntry, changeTextReplaceEntry, textPreview } =
    useNodeActions();
  const view = useNodeView();
  const entries = textReplaceEntries(data);
  const overriddenEntryIds = new Set(
    view.edges
      .filter((edge) => edge.target === id)
      .map((edge) => textReplaceReplacementEntryId(edge.targetHandle))
      .filter((entryId): entryId is string => entryId !== null),
  );

  return (
    <div className={`workflow-node text-replace-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
        <div className="combiner-count-controls">
          <button
            className="combiner-count-button nodrag"
            type="button"
            onClick={() => addTextReplaceEntry(id)}
            aria-label="Add replacement"
          >
            +
          </button>
        </div>
      </div>
      <span className="node-description">{data.description}</span>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-input">
          <Handle type="target" position={Position.Left} />
          <PortLabel data={data} direction="input" label="Text / JSON Input" valueType="text" />
        </div>
      </div>
      <div className="text-replace-entries">
        {entries.length === 0 ? (
          <span className="node-field-label text-replace-empty">No replacements yet — add one</span>
        ) : (
          entries.map((entry) => {
            const overridden = overriddenEntryIds.has(entry.id);
            return (
              <div
                className={`text-replace-entry${overridden ? ' text-replace-entry-overridden' : ''}`}
                key={entry.id}
              >
                <Handle
                  id={textReplaceReplacementHandle(entry.id)}
                  className="text-replace-replacement-handle"
                  type="target"
                  position={Position.Left}
                />
                <input
                  className="node-stat-name-input text-replace-field nodrag"
                  type="text"
                  value={entry.source}
                  placeholder="Find (case-insensitive)"
                  aria-label="Find text"
                  onChange={(event) => changeTextReplaceEntry(id, entry.id, 'source', event.target.value)}
                />
                <span className="text-replace-arrow" aria-hidden>
                  →
                </span>
                <input
                  className={`node-stat-name-input text-replace-field nodrag${overridden ? ' text-replace-field-overridden' : ''}`}
                  type="text"
                  value={entry.replacement}
                  placeholder="Replace with"
                  aria-label="Replacement text"
                  title={overridden ? 'Replacement is overridden by a connection' : undefined}
                  onChange={(event) =>
                    changeTextReplaceEntry(id, entry.id, 'replacement', event.target.value)
                  }
                />
                {overridden ? (
                  <span className="text-replace-override-tag" title="Overridden by connection">
                    conn
                  </span>
                ) : null}
                <button
                  className="combiner-count-button text-replace-remove nodrag"
                  type="button"
                  onClick={() => removeTextReplaceEntry(id, entry.id)}
                  aria-label="Remove replacement"
                >
                  -
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="node-actions">
        <span className="run-note">{data.preview}</span>
        <button
          className="inspect-button nodrag"
          type="button"
          onClick={() => textPreview(id, data.fullText ?? '')}
        >
          Text Preview
        </button>
      </div>
      <div className="workflow-ports">
        <div className="workflow-port workflow-port-output">
          <PortLabel data={data} direction="output" handle="text" label="Text" valueType="text" />
          <Handle id="text" type="source" position={Position.Right} />
        </div>
        <div className="workflow-port workflow-port-output">
          <PortLabel data={data} direction="output" handle="json" label="JSON" valueType="json" />
          <Handle id="json" type="source" position={Position.Right} />
        </div>
      </div>
    </div>
  );
}
