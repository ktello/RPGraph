import { test, expect } from '@playwright/test';
import { launchAppWithWorkflow, cleanup, type LaunchedApp, type WorkflowFixture } from './helpers';
import { currentCoreNodeVersions } from '../../src/nodes/nodeVersion';

function workflow(): WorkflowFixture {
  return {
    format: 'rpgraph-workflow',
    formatVersion: '1.2',
    savedAt: '2026-07-18T00:00:00.000Z',
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      {
        id: 'tr',
        type: 'workflow',
        position: { x: 420, y: 60 },
        data: {
          nodeType: 'text-replace',
          nodeDataVersion: currentCoreNodeVersions['text-replace'],
          label: 'Text Replace',
          description: 'Swap source text for replacements',
          preview: 'Applied 2 replacements',
          textReplaceEntries: [
            { id: 'e1', source: 'Hero', replacement: 'Zed' },
            { id: 'e2', source: 'Villain', replacement: 'Doom' },
          ],
        },
      },
      {
        id: 'src',
        type: 'workflow',
        position: { x: 40, y: 60 },
        data: {
          nodeType: 'last-rp-output',
          nodeDataVersion: currentCoreNodeVersions['last-rp-output'],
          label: 'Last RP Output',
          description: 'Latest RP output',
          preview: 'Not run yet',
        },
      },
    ],
    edges: [
      { id: 'ovr', source: 'src', sourceHandle: null, target: 'tr', targetHandle: 'replacement:e1' },
    ],
  };
}

let app: LaunchedApp | undefined;

test.afterEach(async () => {
  await cleanup(app);
  app = undefined;
});

test('Text Replace shows one override handle per entry and marks the connected one', async () => {
  app = await launchAppWithWorkflow(workflow());
  const { page } = app;
  const wrapper = page.locator('.react-flow__node[data-id="tr"]');
  const card = wrapper.locator('.text-replace-node');
  await expect(card).toBeVisible();

  // One replacement-override handle per entry.
  await expect(card.locator('.text-replace-replacement-handle')).toHaveCount(2);

  const rows = card.locator('.text-replace-entry');
  // Only the connected entry (e1, first row) is marked overridden.
  await expect(rows.nth(0)).toHaveClass(/text-replace-entry-overridden/);
  await expect(rows.nth(0).locator('.text-replace-override-tag')).toBeVisible();
  await expect(rows.nth(0).locator('.text-replace-field-overridden')).toHaveCount(1);

  await expect(rows.nth(1)).not.toHaveClass(/text-replace-entry-overridden/);
  await expect(rows.nth(1).locator('.text-replace-override-tag')).toHaveCount(0);

  // The typed replacement value is preserved (bypassed, not cleared).
  await expect(rows.nth(0).locator('input[aria-label="Replacement text"]')).toHaveValue('Zed');

  // The override handle sits on the node's left edge (within a handle-width of it).
  const handleX = (await rows.nth(0).locator('.text-replace-replacement-handle').boundingBox())!.x;
  const nodeLeft = (await wrapper.boundingBox())!.x;
  expect(Math.abs(handleX - nodeLeft)).toBeLessThan(16);
});
