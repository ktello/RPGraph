import type { WorkflowNodeData } from '../../types';

export function resetCharacterStatsRuntimeData(): Partial<WorkflowNodeData> {
  return {
    characterStatsState: undefined,
    characterStatsBaselineState: undefined,
    characterStatsLastRpDateTime: undefined,
    characterStatsTimeline: undefined,
    characterStatsStatus: 'Initializes from connected context',
    preview: 'Waiting for automatic initialization',
    fullText: '',
    characterStatsContextText: '',
    characterStatsLastPrompt: '',
    characterStatsLastResponse: '',
    characterStatsLastChanges: undefined,
  };
}
