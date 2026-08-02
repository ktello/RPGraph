import type { NodeProps } from '@xyflow/react';
import type { WorkflowNode } from '../types';
import { PlaceholderNodeCard } from './PlaceholderNodeCard';

export function MissingNodeCard({ data }: NodeProps<WorkflowNode>) {
  return (
    <PlaceholderNodeCard
      data={data}
      classPrefix="missing-node"
      fallbackTitle="Missing Node"
      note={<>Plugin not installed: {data.nodeType}</>}
    />
  );
}
