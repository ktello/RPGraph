import { useEffect, useRef, useState } from 'react';
import type {
  LlmRunHistoryEntry,
  RunLlmReport,
} from '../components/AppDialogs';
import type { LastRunDebug } from './debugSnapshot';
import type {
  ActiveRun,
  CancelReason,
} from './useGraphRun';

export function useRunLifecycle() {
  const [isRunning, setIsRunning] = useState(false);
  const [runLlmReport, setRunLlmReport] = useState<RunLlmReport | null>(null);
  const [showRunLlmReport, setShowRunLlmReport] = useState(false);
  const [runDurationMs, setRunDurationMs] = useState<number>(0);
  const [runHistory, setRunHistory] = useState<LlmRunHistoryEntry[]>([]);
  const [workflowComfyGenerationActive, setWorkflowComfyGenerationActive] = useState(false);
  const workflowComfyGenerationActiveCountRef = useRef(0);
  const activeRun = useRef<ActiveRun | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const lastRunDebugRef = useRef<LastRunDebug | null>(null);
  const activeRunCancelReason = useRef<CancelReason>('cancel');
  const activeRunLlmReport = useRef<RunLlmReport | null>(null);
  const pendingRunRestart = useRef<(() => void) | null>(null);
  const runStartTimeRef = useRef<number | null>(null);
  const runEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const intervalId = setInterval(() => {
      if (runStartTimeRef.current !== null) {
        setRunDurationMs(performance.now() - runStartTimeRef.current);
      }
    }, 50);
    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  function updateWorkflowComfyGenerationActive(active: boolean) {
    workflowComfyGenerationActiveCountRef.current = Math.max(
      0,
      workflowComfyGenerationActiveCountRef.current + (active ? 1 : -1),
    );
    setWorkflowComfyGenerationActive(workflowComfyGenerationActiveCountRef.current > 0);
  }

  function cancelCurrentRun(reason: CancelReason = 'cancel') {
    const run = activeRun.current;
    if (!run) {
      return false;
    }
    activeRunCancelReason.current = reason;
    if (reason === 'cancel') {
      pendingRunRestart.current = null;
    }
    run.controller.abort();
    return true;
  }

  return {
    isRunning,
    setIsRunning,
    runLlmReport,
    setRunLlmReport,
    showRunLlmReport,
    setShowRunLlmReport,
    runDurationMs,
    setRunDurationMs,
    runHistory,
    setRunHistory,
    workflowComfyGenerationActive,
    updateWorkflowComfyGenerationActive,
    activeRunRef: activeRun,
    activeRunId,
    setActiveRunId,
    lastRunDebugRef,
    activeRunCancelReasonRef: activeRunCancelReason,
    activeRunLlmReportRef: activeRunLlmReport,
    pendingRunRestartRef: pendingRunRestart,
    runStartTimeRef,
    runEndTimeRef,
    cancelCurrentRun,
  };
}
