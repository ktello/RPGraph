import type { CoreNodeFolderDefinition } from '../types';
import { currentCoreNodeVersions } from '../nodeVersion';
import { input, output } from '../portHelpers';
import { coreNodeLayouts } from '../nodeLayout';
import { baseData } from '../shared/persistenceHelpers';
import { TextPreviewNodeCard } from './Card';
import { executeTextPreviewNode } from './execute';

const legacyTextPreviewNodeWidth = 390;
const legacyTextPreviewNodeHeight = 350;

export const definition: CoreNodeFolderDefinition = {
  type: 'text-preview',
  dataVersion: currentCoreNodeVersions['text-preview'],
  label: 'Text Preview',
  description: 'Display passing text and estimated context size',
  menuDescription: 'Display passing text and token estimate',
  paletteGroup: 'Input & Output',
  paletteOrder: 5,
  origin: 'core',
  passiveRuntime: true,
  requiresPreparedInputEdge: true,
  hydrateStyle: (node) => ({
    ...node.style,
    width:
      node.style?.width === undefined ||
      (node.style.width === legacyTextPreviewNodeWidth &&
        node.style?.height === legacyTextPreviewNodeHeight)
        ? coreNodeLayouts['text-preview'].width
        : node.style.width,
    height:
      node.style?.height === undefined ||
      (node.style.width === legacyTextPreviewNodeWidth &&
        node.style.height === legacyTextPreviewNodeHeight)
        ? coreNodeLayouts['text-preview'].height
        : node.style.height,
  }),
  ports: () => [input('default', 'mixed', 'Mixed Input'), output('default', 'mixed', 'Mixed')],
  Component: TextPreviewNodeCard,
  execute: executeTextPreviewNode,
  create: ({ position, createId }) => ({
    id: createId('text-preview'),
    type: 'workflow',
    position,
    data: {
      label: 'Text Preview',
      description: 'Display passing text and estimated context size',
      preview: 'Waiting for text ...',
      nodeType: 'text-preview',
      fullText: '',
    },
  }),
  persistence: {
    saveData: (data) => baseData(data, 'Waiting for text ...'),
    hydrateData: (data) => baseData(data, 'Waiting for text ...'),
  },
};
