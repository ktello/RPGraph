import { test, expect } from '@playwright/test';
import { launchAppWithWorkflow, cleanup, type LaunchedApp, type WorkflowFixture } from './helpers';
import { currentCoreNodeVersions } from '../../src/nodes/nodeVersion';

// The Text Preview's runtime `fullText` is stripped on load, so its display
// element renders as the (readonly) empty-state textarea. It shares the
// `.text-preview-preview` class with the highlighted <pre> shown when real
// text flows through, so injecting text into it exercises the same CSS: the
// element must scroll internally rather than let content grow the node.
const BIG = Array.from({ length: 400 }, (_, i) => `Line ${i + 1}: the quick brown fox jumps.`).join('\n');

function textPreviewWorkflow(): WorkflowFixture {
  return {
    format: 'rpgraph-workflow',
    formatVersion: '1.2',
    savedAt: '2026-07-17T00:00:00.000Z',
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      {
        id: 'tp-1',
        type: 'workflow',
        position: { x: 60, y: 40 },
        style: { width: 380, height: 360 },
        data: {
          nodeType: 'text-preview',
          nodeDataVersion: currentCoreNodeVersions['text-preview'],
          label: 'Text Preview',
          description: 'Display passing text and estimated context size',
          preview: 'Preview',
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

test('Text Preview scrolls overflowing text instead of growing the node', async () => {
  app = await launchAppWithWorkflow(textPreviewWorkflow());
  const { page } = app;
  const wrapper = page.locator('.react-flow__node[data-id="tp-1"]');
  await wrapper.locator('.text-preview-node').waitFor();

  const result = await wrapper.evaluate((wrapperEl, big) => {
    const card = wrapperEl.querySelector('.text-preview-node') as HTMLElement;
    const preview = card.querySelector('.text-preview-preview') as HTMLTextAreaElement;
    const heightBefore = Math.round(wrapperEl.getBoundingClientRect().height);
    preview.value = big;
    const cardRect = card.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    const style = getComputedStyle(preview);
    return {
      heightBefore,
      heightAfter: Math.round(wrapperEl.getBoundingClientRect().height),
      overflowY: style.overflowY,
      scrollable: preview.scrollHeight > preview.clientHeight + 1,
      bottomWithinCard: previewRect.bottom <= cardRect.bottom + 1,
    };
  }, BIG);

  // The node keeps its size; the text scrolls inside a bounded, overflow area.
  expect(result.heightAfter).toBe(result.heightBefore);
  expect(result.overflowY).toBe('auto');
  expect(result.scrollable).toBe(true);
  expect(result.bottomWithinCard).toBe(true);
});
