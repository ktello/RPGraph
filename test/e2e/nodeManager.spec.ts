import { test, expect, type Page } from '@playwright/test';
import { launchAppWithWorkflow, cleanup, type LaunchedApp, type WorkflowFixture } from './helpers';
import { currentCoreNodeVersions } from '../../src/nodes/nodeVersion';

function textReplaceWorkflow(): WorkflowFixture {
  return {
    format: 'rpgraph-workflow',
    formatVersion: '1.2',
    savedAt: '2026-07-17T00:00:00.000Z',
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      {
        id: 'tr-1',
        type: 'workflow',
        position: { x: 120, y: 120 },
        data: {
          nodeType: 'text-replace',
          nodeDataVersion: currentCoreNodeVersions['text-replace'],
          label: 'Text Replace',
          description: 'Swap source text for replacements',
          preview: 'No replacements configured',
          textReplaceEntries: [{ id: 'a', source: 'Hero', replacement: 'Aria' }],
        },
      },
    ],
    edges: [],
  };
}

function settingsWithDisabled(disabled: string[]) {
  return {
    format: 'rpgraph-settings',
    version: 1,
    connections: [
      { id: 'c1', label: 'Local', baseUrl: 'http://localhost:1234/v1', apiKey: '', model: 'test' },
    ],
    defaultConnectionId: 'c1',
    options: {
      englishProcessingEnabled: false,
      displayLanguage: 'en',
      disabledNodeTypes: disabled,
    },
  };
}

let app: LaunchedApp | undefined;

test.afterEach(async () => {
  await cleanup(app);
  app = undefined;
});

function typeRow(page: Page, type: string) {
  return page
    .locator('.node-manager-dialog .node-manager-row')
    .filter({ has: page.locator('.node-manager-type', { hasText: new RegExp(`^${type}$`) }) });
}

test('Node Manager lists types, locks load-bearing ones, and toggles', async () => {
  app = await launchAppWithWorkflow(textReplaceWorkflow());
  const { page } = app;
  await page.getByRole('button', { name: 'Nodes', exact: true }).click();
  await page.locator('.node-manager-dialog').waitFor();

  expect(await page.locator('.node-manager-dialog .node-manager-row').count()).toBeGreaterThan(15);

  // input / output are locked on.
  await expect(typeRow(page, 'input').locator('.node-manager-locked')).toBeVisible();
  await expect(typeRow(page, 'input').locator('input[type="checkbox"]')).toBeDisabled();
  await expect(typeRow(page, 'output').locator('input[type="checkbox"]')).toBeDisabled();

  // text-replace starts enabled and can be toggled off.
  const trCheckbox = typeRow(page, 'text-replace').locator('input[type="checkbox"]');
  await expect(trCheckbox).toBeChecked();
  await expect(trCheckbox).toBeEnabled();
  await trCheckbox.uncheck();
  await expect(trCheckbox).not.toBeChecked();
});

test('a disabled type is hidden from the palette and its instances load as placeholders', async () => {
  app = await launchAppWithWorkflow(textReplaceWorkflow(), {
    settings: settingsWithDisabled(['text-replace']),
  });
  const { page } = app;

  // Existing instance degraded to the preserved placeholder card (not the real node).
  const wrapper = page.locator('.react-flow__node[data-id="tr-1"]');
  await expect(wrapper.locator('.disabled-core-node')).toBeVisible();
  await expect(wrapper.locator('.text-replace-node')).toHaveCount(0);
  await expect(wrapper.locator('.disabled-core-node-note')).toContainText('text-replace');
  expect(await wrapper.locator('.react-flow__handle').count()).toBeGreaterThan(0);

  // The palette omits Text Replace but still lists other (enabled) types.
  const palette = page.locator('.node-palette-items');
  await expect(palette.getByText('Text Combiner', { exact: true })).toHaveCount(1);
  await expect(palette.getByText('Text Replace', { exact: true })).toHaveCount(0);
});
