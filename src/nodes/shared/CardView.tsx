/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, type RefObject } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
import type { WorkflowNode } from '../../types';
import { llmPromptSwitchPromptTitles } from '../../workflow';

const inputTransformCallLabels = new Set(['Translate', 'Act RP', 'Act Phone']);

export function runStateClassName(data: WorkflowNode['data']) {
  if (data.runError) {
    return ' workflow-node-error';
  }
  const activeClassName = data.runActive ? ' workflow-node-active' : '';
  return data.runPrepared
    ? ` workflow-node-prepared${activeClassName}`
    : data.runCompleted
      ? ` workflow-node-complete${activeClassName}`
      : activeClassName;
}

export function useNodeLayoutSync(id: string): RefObject<HTMLDivElement | null> {
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    updateNodeInternals(id);
    void document.fonts?.ready.then(() => {
      if (!disposed) {
        updateNodeInternals(id);
      }
    });
    const nodeBody = nodeBodyRef.current;
    if (!nodeBody || typeof ResizeObserver === 'undefined') {
      return () => {
        disposed = true;
      };
    }
    const observer = new ResizeObserver(() => updateNodeInternals(id));
    observer.observe(nodeBody);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [id, updateNodeInternals]);

  return nodeBodyRef;
}

function formatCallDuration(durationMs: number) {
  return durationMs >= 1000 ? `${(durationMs / 1000).toFixed(2)} s` : `${durationMs} ms`;
}

function getExpectedCallLabels(data: WorkflowNode['data']): string[] {
  switch (data.nodeType) {
    case 'input':
      return [];
    case 'custom':
      return ['Custom Node LLM'];
    case 'llm-prompt':
      return ['Generate'];
    case 'event-manager':
      return ['Events'];
    case 'character-stats': {
      const actual = data.llmCallStats?.find((s) => s.label === 'Init Stats' || s.label === 'Patch Stats');
      return [actual?.label ?? (data.characterStatsState ? 'Patch Stats' : 'Init Stats')];
    }
    case 'history':
      return data.historyTimeTrackingEnabled ? ['RP Time'] : [];
    case 'output':
      return data.speakerAnalysisEnabled ? ['Speakers'] : [];
    case 'context-compression':
      return ['Compress'];
    case 'llm-decision': {
      const questionCount = data.llmDecisionQuestions?.length || data.llmDecisionOutputToggles?.length || 1;
      const labels: string[] = [];
      for (let i = 0; i < questionCount; i++) {
        labels.push(`Decision ${i + 1}`);
      }
      return labels;
    }
    case 'llm-prompt-switch': {
      const outputTitles = data.llmPromptSwitchOutputTitles ?? [];
      const selectedOutputChannel = data.llmPromptSwitchSelectedOutputChannel ?? 0;
      const selectedPromptSlot = data.llmPromptSwitchSelectedPromptSlot ?? 0;
      const promptTitles = llmPromptSwitchPromptTitles(data, selectedOutputChannel);
      const label = `${outputTitles[selectedOutputChannel] ?? `Output ${selectedOutputChannel}`} / ${promptTitles[selectedPromptSlot] ?? `Prompt ${selectedPromptSlot}`}`;
      return [label];
    }
    default:
      return [];
  }
}

export function LlmCallMetrics({ data }: { data: WorkflowNode['data'] }) {
  const expectedLabels = getExpectedCallLabels(data);
  const actualStats = data.llmCallStats ?? [];
  if (data.nodeType === 'input') {
    const actual = actualStats.find((stats) => inputTransformCallLabels.has(stats.label));
    const label = actual?.label ?? 'Translate';
    return (
      <div className="llm-call-metrics">
        <div className="llm-call-metric input-transform">
          <strong>{label}</strong>
          <span>IN {actual?.inputTokens !== undefined ? actual.inputTokens : '?'}</span>
          <span>OUT {actual?.outputTokens !== undefined ? actual.outputTokens : '?'}</span>
          {actual?.reasoningTokens !== undefined && actual.reasoningTokens > 0 && (
            <span>RSN {actual.reasoningTokens}</span>
          )}
          <span>{actual?.durationMs !== undefined ? formatCallDuration(actual.durationMs) : '? s'}</span>
        </div>
      </div>
    );
  }
  const labels = [
    ...expectedLabels,
    ...actualStats.flatMap((stats) => expectedLabels.includes(stats.label) ? [] : [stats.label]),
  ];
  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="llm-call-metrics">
      {labels.map((label) => {
        const actual = actualStats.find((stats) => stats.label === label);
        return (
          <div className="llm-call-metric" key={label}>
            <strong>{label}</strong>
            <span>IN {actual?.inputTokens !== undefined ? actual.inputTokens : '?'}</span>
            <span>OUT {actual?.outputTokens !== undefined ? actual.outputTokens : '?'}</span>
            {actual?.reasoningTokens !== undefined && actual.reasoningTokens > 0 && (
              <span>RSN {actual.reasoningTokens}</span>
            )}
            <span>{actual?.durationMs !== undefined ? formatCallDuration(actual.durationMs) : '? s'}</span>
          </div>
        );
      })}
    </div>
  );
}
