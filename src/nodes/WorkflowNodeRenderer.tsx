import { memo, type CSSProperties } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../types';
import { DisabledCoreNodeCard } from './DisabledCoreNodeCard';
import { IncompatibleCoreNodeCard } from './IncompatibleCoreNodeCard';
import { getRegisteredNode } from './registry';
import { MissingNodeCard } from './MissingNodeCard';

function WorkflowNodeRendererComponent(props: NodeProps<WorkflowNode>) {
  const definition = getRegisteredNode(props.data.nodeType);
  const version = props.data.nodeDataVersion ?? definition?.dataVersion;
  // Auto-mode cards paint at the definition's layout width. Placeholder cards
  // (kind set) keep their own widths, so the variable is scoped to live cards.
  const cardWidth =
    definition && definition.layout.mode === 'auto' && props.data.kind === undefined
      ? `${definition.layout.width}px`
      : undefined;
  const style =
    version || cardWidth
      ? {
          ...(version ? { '--node-version-label': JSON.stringify(`v${version}`) } : {}),
          ...(cardWidth ? { '--node-card-width': cardWidth } : {}),
        } as CSSProperties
      : undefined;

  let card;
  if (props.data.kind === 'incompatible-core-node') {
    card = <IncompatibleCoreNodeCard {...props} />;
  } else if (props.data.kind === 'disabled-core-node') {
    card = <DisabledCoreNodeCard {...props} />;
  } else if (props.data.kind === 'missing-plugin-node' || !definition) {
    card = <MissingNodeCard {...props} />;
  } else {
    const Component = definition.Component;
    card = <Component {...props} />;
  }

  return (
    <div className="node-version-scope" style={style}>
      {card}
    </div>
  );
}

function workflowNodeRendererPropsEqual(previous: NodeProps<WorkflowNode>, next: NodeProps<WorkflowNode>) {
  return (
    previous.id === next.id &&
    previous.type === next.type &&
    previous.data === next.data &&
    previous.width === next.width &&
    previous.height === next.height &&
    previous.sourcePosition === next.sourcePosition &&
    previous.targetPosition === next.targetPosition &&
    previous.dragHandle === next.dragHandle &&
    previous.parentId === next.parentId &&
    previous.selected === next.selected &&
    previous.selectable === next.selectable &&
    previous.deletable === next.deletable &&
    previous.draggable === next.draggable &&
    previous.isConnectable === next.isConnectable
  );
}

export const WorkflowNodeRenderer = memo(WorkflowNodeRendererComponent, workflowNodeRendererPropsEqual);
