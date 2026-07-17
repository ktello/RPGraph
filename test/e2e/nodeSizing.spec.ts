import { test, expect } from '@playwright/test';
import { launchAppWithWorkflow, cleanup, type LaunchedApp, type WorkflowFixture } from './helpers';
import { currentCoreNodeVersions } from '../../src/nodes/nodeVersion';

const LONG = 'supercalifragilisticexpialidocious-antidisestablishmentarianism-pneumonoultramicroscopicsilicovolcanoconiosis';
const LONG_SENTENCE = 'The quick brown fox jumps over the lazy dog and then keeps running far past the edge of anything reasonable.';

function sizingFixture(): WorkflowFixture {
  return {
    format: 'rpgraph-workflow',
    formatVersion: '1.2',
    savedAt: '2026-07-17T00:00:00.000Z',
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      {
        // Drifted save: persisted wrapper width disagrees with the 430px layout.
        id: 'drifted-replace',
        type: 'workflow',
        position: { x: 40, y: 40 },
        style: { width: 250 },
        width: 250,
        measured: { width: 250, height: 320 },
        data: {
          nodeType: 'text-replace',
          nodeDataVersion: currentCoreNodeVersions['text-replace'],
          label: 'Text Replace',
          description: 'Swap source text for replacements',
          preview: 'Applied 2 replacements with a very long preview note that keeps going',
          fullText: LONG_SENTENCE,
          runtimePortValues: {
            'input:default': LONG_SENTENCE,
            'output:text': LONG_SENTENCE,
            'output:json': LONG_SENTENCE,
          },
          textReplaceEntries: [
            { id: 'a', source: LONG, replacement: LONG_SENTENCE },
            { id: 'b', source: 'Hero', replacement: 'Aria' },
          ],
        },
      },
      {
        // Legacy save: top-level height (which React Flow prefers) below the minimum.
        id: 'legacy-llm',
        type: 'workflow',
        position: { x: 560, y: 40 },
        height: 660,
        style: { width: 548, height: 660 },
        data: {
          nodeType: 'llm-prompt',
          nodeDataVersion: currentCoreNodeVersions['llm-prompt'],
          label: 'LLM Prompt',
          description: 'LLM provider call',
          preview: 'Not run yet',
          llmPromptBefore: '',
          llmPromptAfter: '',
          llmPromptActions: [],
          llmPromptCommands: [],
        },
      },
    ],
    edges: [],
  };
}

let app: LaunchedApp | undefined;

test.afterEach(async () => {
  await cleanup(app);
  app = undefined;
});

test('a drifted auto-node save heals: wrapper equals the 430px card', async () => {
  app = await launchAppWithWorkflow(sizingFixture());
  const { page } = app;
  const wrapper = page.locator('.react-flow__node[data-id="drifted-replace"]');
  await wrapper.locator('.text-replace-node').waitFor();

  const sizes = await wrapper.evaluate((wrapperEl) => {
    const card = wrapperEl.querySelector('.text-replace-node') as HTMLElement;
    return {
      wrapperInlineWidth: (wrapperEl as HTMLElement).style.width,
      wrapperWidth: wrapperEl.getBoundingClientRect().width,
      cardWidth: card.getBoundingClientRect().width,
    };
  });
  // The saved 250px never reaches the DOM: the wrapper re-measures to the card.
  expect(sizes.wrapperInlineWidth).toBe('');
  expect(Math.abs(sizes.wrapperWidth - sizes.cardWidth)).toBeLessThanOrEqual(1);
  expect(Math.round(sizes.cardWidth)).toBe(430);
});

test('no non-handle content extends past the card boundary under long content', async () => {
  app = await launchAppWithWorkflow(sizingFixture());
  const { page } = app;
  const wrapper = page.locator('.react-flow__node[data-id="drifted-replace"]');
  await wrapper.locator('.text-replace-node').waitFor();
  await page.waitForTimeout(400);

  const offenders = await wrapper.evaluate((wrapperEl) => {
    const card = wrapperEl.querySelector('.text-replace-node') as HTMLElement;
    const cardRect = card.getBoundingClientRect();
    const isHandle = (el: Element) =>
      el.classList.contains('react-flow__handle') || !!el.closest('.react-flow__handle');
    const out: string[] = [];
    card.querySelectorAll('*').forEach((el) => {
      if (isHandle(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      if (rect.right > cardRect.right + 1 || rect.bottom > cardRect.bottom + 1) {
        out.push(`${el.tagName.toLowerCase()}.${Array.from(el.classList).join('.')}`);
      }
    });
    return out;
  });
  expect(offenders).toEqual([]);
});

test('a legacy top-level height below the minimum heals to the layout bounds', async () => {
  app = await launchAppWithWorkflow(sizingFixture());
  const { page } = app;
  const wrapper = page.locator('.react-flow__node[data-id="legacy-llm"]');
  await wrapper.locator('.llm-prompt-node').waitFor();

  const sizes = await wrapper.evaluate((wrapperEl) => ({
    inlineWidth: (wrapperEl as HTMLElement).style.width,
    inlineHeight: (wrapperEl as HTMLElement).style.height,
    height: wrapperEl.getBoundingClientRect().height,
    width: wrapperEl.getBoundingClientRect().width,
  }));
  // The old top-level 660 (which React Flow prefers over style) is gone; the
  // normalized style drives the wrapper at the layout minimum.
  expect(sizes.inlineWidth).toBe('548px');
  expect(sizes.inlineHeight).toBe('1140px');
  expect(Math.round(sizes.width)).toBe(548);
  expect(sizes.height).toBeGreaterThanOrEqual(1139);
});
