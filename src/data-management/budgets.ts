export const DATA_MANAGEMENT_BUDGETS = {
  maxRecentLlmCalls: 10,
  llmPreviewMaxChars: 500,
  maxCheckpoints: 50,
  maxDebugDiagnosticsPerNode: 3,
  maxAssistantTimelineEntries: 12,
  maxAssistantEventEntries: 25,
  maxAssistantNodeNeighborhood: 12,
} as const;

export function truncateForBudget(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxChars - 1))}...`;
}
