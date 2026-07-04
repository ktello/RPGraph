import { useRef, useState } from 'react';
import {
  createTurnTrace,
  type TurnTrace,
} from './turnTrace';

type CreateTurnTraceInput = Parameters<typeof createTurnTrace>[0];

export function useTurnTraceState() {
  const [turnTraces, setTurnTracesState] = useState<TurnTrace[]>([]);
  const turnTracesRef = useRef(turnTraces);

  // All writes go through this setter so the ref stays in sync with the state.
  function setTurnTraces(next: TurnTrace[]) {
    turnTracesRef.current = next;
    setTurnTracesState(next);
  }

  function recordTurnTrace(input: CreateTurnTraceInput) {
    const trace = createTurnTrace(input);
    const retained = trace.status === 'completed'
      ? turnTracesRef.current.filter(
          (entry) => entry.turnId !== trace.turnId || entry.status !== 'completed',
        )
      : turnTracesRef.current;
    setTurnTraces([...retained, trace]);
    return trace;
  }

  function removeTurnTracesForTurn(turnId: string) {
    setTurnTraces(turnTracesRef.current.filter((trace) => trace.turnId !== turnId));
  }

  function clearTurnTraces() {
    setTurnTraces([]);
  }

  return {
    turnTraces,
    turnTracesRef,
    recordTurnTrace,
    removeTurnTracesForTurn,
    clearTurnTraces,
  };
}
