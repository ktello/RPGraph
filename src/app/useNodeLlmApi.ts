import { useMemo } from 'react';
import { NodeLlmApi } from '../llm/NodeLlmApi';
import type { ConnectionPreset, LlmCallStats } from '../types';

type RecordNodeLlmCall = (
  nodeId: string,
  label: string,
  stats: LlmCallStats,
  metadata?: { startedAtMs: number },
) => void;

type UseNodeLlmApiOptions = {
  resolveConnection: (
    connectionId?: string,
    purpose?: string,
    signal?: AbortSignal,
  ) => Promise<ConnectionPreset>;
  recordCall: RecordNodeLlmCall;
};

export function useNodeLlmApi({
  resolveConnection,
  recordCall,
}: UseNodeLlmApiOptions) {
  return useMemo(
    () => new NodeLlmApi({
      resolveConnection,
      recordCall,
    }),
    [recordCall, resolveConnection],
  );
}
