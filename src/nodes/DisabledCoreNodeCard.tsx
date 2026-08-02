import type { NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../types';
import { PlaceholderNodeCard } from './PlaceholderNodeCard';

// Inert placeholder for a node whose type the user disabled in the Node Manager.
// Renders the stored ports so connected edges stay attached; the node's original
// data is preserved and restored when the type is re-enabled and reloaded.
export function DisabledCoreNodeCard({ data }: NodeProps<WorkflowNode>) {
  return (
    <PlaceholderNodeCard
      data={data}
      classPrefix="disabled-core-node"
      fallbackTitle="Disabled Node"
      note={<>Node type disabled: {data.nodeType}</>}
      hint="Re-enable this type in the Node Manager and reload the workflow to restore it."
    />
  );
}
