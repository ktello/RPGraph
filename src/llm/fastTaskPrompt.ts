const fastTaskReasoningStart = [
  'Reasoning strength: low.',
  'This is a short deterministic helper task. Use the minimum reasoning needed and proceed directly to the requested output.',
].join('\n');

const fastTaskReasoningEnd =
  'Do not perform extended analysis. Complete the helper task directly and return only the requested result.';

export function fastTaskPrompt(prompt: string) {
  return [fastTaskReasoningStart, prompt.trim(), fastTaskReasoningEnd]
    .filter(Boolean)
    .join('\n\n');
}
