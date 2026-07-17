import { useState } from 'react';
import { Handle, NodeResizeControl, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { contextBuilderInputCount, contextBuilderInputHandle, contextBuilderText } from '../../workflow';
import { useNodeActions } from '../NodeActionsContext';
import { coreNodeLayouts } from '../nodeLayout';
import { runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';

export function ContextBuilderNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const { loadContextBuilder, reorderContextBuilderItem, textPreview, toggleContextBuilderItem } = useNodeActions();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const items = data.contextBuilderItems ?? [];
  const disabledItems = items.filter((item) => !item.enabled);
  const enabledItems = items.filter((item) => item.enabled);
  const outputText = contextBuilderText(items);

  return (
    <div className={`workflow-node context-builder-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <NodeResizeControl
        className="context-builder-resize-control"
        minHeight={coreNodeLayouts['context-builder'].minHeight}
        minWidth={coreNodeLayouts['context-builder'].minWidth}
      />
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <span className="node-description">{data.description}</span>
      <div className="context-builder-inputs">
        {Array.from({ length: contextBuilderInputCount }, (_, index) => (
          <div className={`context-builder-port context-input-${index + 1}`} key={contextBuilderInputHandle(index)}>
            <Handle id={contextBuilderInputHandle(index)} type="target" position={Position.Left} />
            <PortLabel data={data} direction="input" handle={contextBuilderInputHandle(index)} label={`JSON Input ${index + 1}`} valueType="json" />
            <div className="context-builder-port-disabled nodrag nowheel">
              {disabledItems.filter((item) => item.sourceIndex === index).map((item) => (
                <label className="context-builder-disabled-item node-toggle" key={item.id}>
                  <input type="checkbox" checked={false} onChange={(event) => toggleContextBuilderItem(id, item.id, event.target.checked)} />
                  {item.fieldLabel}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="load-text-button context-builder-load nodrag" type="button" onClick={() => void loadContextBuilder(id)}>Load Inputs</button>
      <span className="node-field-label">SECTIONS / DRAG TO REORDER</span>
      <div className="context-builder-items nodrag nowheel">
        {enabledItems.length === 0 && (
          <span className="run-note context-builder-empty">
            {items.length === 0 ? 'Load connected JSON inputs to manage their sections.' : 'Enable a section above to include it in the output.'}
          </span>
        )}
        {enabledItems.map((item) => (
          <div
            className={['context-builder-item', draggedItemId === item.id ? 'dragging' : ''].filter(Boolean).join(' ')}
            draggable
            key={item.id}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/context-builder-item', item.id);
              const transparentPreview = document.createElement('canvas');
              transparentPreview.width = 1;
              transparentPreview.height = 1;
              event.dataTransfer.setDragImage(transparentPreview, 0, 0);
              setDraggedItemId(item.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (!draggedItemId || draggedItemId === item.id) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              const placement = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';
              reorderContextBuilderItem(id, draggedItemId, item.id, placement);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDraggedItemId(null);
            }}
            onDragEnd={() => setDraggedItemId(null)}
          >
            <span className="context-builder-grip" aria-hidden="true">::</span>
            <label className="node-toggle">
              <input type="checkbox" checked={item.enabled} onChange={(event) => toggleContextBuilderItem(id, item.id, event.target.checked)} />
              <span className="context-builder-label">
                <strong>{item.fieldLabel}</strong>
                <small>
                  <span className={`context-input-text-${item.sourceIndex + 1}`}>JSON Input {item.sourceIndex + 1}</span>
                  {item.sourceLabel.replace(/^(JSON\s+)?Input \d+\s*-\s*/, ' - ')}
                </small>
              </span>
            </label>
            <span className="context-builder-value">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="node-actions context-builder-actions">
        <span className="run-note">{data.contextBuilderStatus ?? data.preview}</span>
        <button className="inspect-button nodrag" type="button" disabled={!outputText} onClick={() => textPreview(id, outputText)}>Show Output</button>
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
