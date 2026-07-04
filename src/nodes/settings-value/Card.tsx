import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { settingsValueEntries, settingsValueHandle } from '../../workflow';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { NodeCustomSelect } from '../shared/NodeCustomSelect';

export function SettingsValueNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const {
    addSettingsValue,
    changeSettingsValueSelection,
    removeSettingsValue,
  } = useNodeActions();
  const { settingsValueDefinitions, settingsValues } = useNodeView();
  const entries = settingsValueEntries(data);

  return (
    <div className={`workflow-node settings-value-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
        <div className="combiner-count-controls">
          <button className="combiner-count-button nodrag" type="button" onClick={() => addSettingsValue(id)} aria-label="Add variable">
            +
          </button>
        </div>
      </div>
      <span className="node-description">{data.description}</span>
      {entries.map((entry) => (
        <div className="settings-value-row" key={entry.id}>
          <div className="settings-value-controls">
            <NodeCustomSelect
              value={entry.optionKey}
              onChange={(val) => changeSettingsValueSelection(id, entry.id, val)}
              options={[
                ...settingsValueDefinitions.map((definition) => ({
                  value: definition.key,
                  label: definition.label,
                })),
              ]}
            />
            {entries.length > 1 && (
              <button className="combiner-count-button nodrag" type="button" onClick={() => removeSettingsValue(id, entry.id)} aria-label="Remove option value">
                -
              </button>
            )}
          </div>
          <div className="workflow-port workflow-port-output settings-value-output">
            <span>{settingsValues[entry.optionKey] ?? ''}</span>
            <Handle id={settingsValueHandle(entry.id)} type="source" position={Position.Right} />
          </div>
        </div>
      ))}
      <span className="run-note number-note">{data.preview}</span>
    </div>
  );
}
