import { describe, expect, it } from 'vitest';
import { fastTaskPrompt } from './fastTaskPrompt';

describe('fastTaskPrompt', () => {
  it('requests low reasoning before and after a helper prompt', () => {
    const prompt = fastTaskPrompt('Return JSON only.');
    expect(prompt).toMatch(/^Reasoning strength: low\./);
    expect(prompt).toContain('\n\nReturn JSON only.\n\n');
    expect(prompt).toMatch(/return only the requested result\.$/);
  });
});
