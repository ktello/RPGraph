import type { WorkflowNode } from '../types';
import type { CoreNodeType } from './types';

// The definition-owned single source of truth for a node's boundary sizing.
// - auto: fixed card width painted via the --node-card-width CSS variable; height
//   hugs content; the interaction wrapper carries no persisted size and measures
//   the card.
// - resizable: user-resizable within bounds; the persisted `style` is the wrapper
//   authority and the card fills it (width:100%/height:100% CSS).
// - manual: the definition's create()/hydrateStyle own the style (wire links).
export type NodeLayout =
  | { mode: 'auto'; width: number }
  | {
      mode: 'resizable';
      width: number;
      height: number;
      minWidth: number;
      minHeight: number;
      maxWidth?: number;
      resizeDirection?: 'vertical';
    }
  | { mode: 'manual' };

export const coreNodeLayouts = {
  input: { mode: 'auto', width: 365 },
  note: { mode: 'resizable', width: 320, height: 220, minWidth: 260, minHeight: 160 },
  group: { mode: 'resizable', width: 560, height: 260, minWidth: 260, minHeight: 120 },
  custom: { mode: 'auto', width: 365 },
  'last-user-input': { mode: 'auto', width: 365 },
  'last-rp-output': { mode: 'auto', width: 365 },
  'event-manager': { mode: 'auto', width: 365 },
  history: { mode: 'auto', width: 365 },
  'memory-slot': { mode: 'manual' },
  'phone-message-router': { mode: 'auto', width: 365 },
  'text-selector': { mode: 'auto', width: 365 },
  'llm-prompt-switch': {
    mode: 'resizable',
    width: 548,
    height: 1140,
    minWidth: 548,
    minHeight: 1140,
    maxWidth: 548,
    resizeDirection: 'vertical',
  },
  'llm-prompt': {
    mode: 'resizable',
    width: 548,
    height: 1140,
    minWidth: 548,
    minHeight: 1140,
    maxWidth: 548,
    resizeDirection: 'vertical',
  },
  combiner: { mode: 'auto', width: 365 },
  'text-replace': { mode: 'auto', width: 430 },
  'load-text': { mode: 'resizable', width: 380, height: 390, minWidth: 300, minHeight: 270 },
  'write-text': { mode: 'resizable', width: 365, height: 390, minWidth: 365, minHeight: 265 },
  'text-preview': { mode: 'resizable', width: 365, height: 455, minWidth: 300, minHeight: 250 },
  'context-builder': { mode: 'resizable', width: 430, height: 620, minWidth: 350, minHeight: 390 },
  'llm-decision': { mode: 'auto', width: 390 },
  'context-compression': { mode: 'auto', width: 365 },
  'character-stats': { mode: 'auto', width: 430 },
  'fixed-number': { mode: 'auto', width: 365 },
  'fixed-bool': { mode: 'auto', width: 365 },
  'settings-value': { mode: 'auto', width: 365 },
  'rp-storybook': { mode: 'auto', width: 365 },
  'rp-storybook-editor': { mode: 'auto', width: 365 },
  output: { mode: 'auto', width: 365 },
  'phone-apps': { mode: 'auto', width: 365 },
} as const satisfies Record<CoreNodeType, NodeLayout>;

type LayoutOwner = {
  layout: NodeLayout;
  hydrateStyle?: (node: WorkflowNode) => WorkflowNode['style'];
};

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function withoutSizeKeys(style: WorkflowNode['style']) {
  if (!style) {
    return undefined;
  }
  const { width: _width, height: _height, ...rest } = style;
  return rest;
}

/**
 * Create-time style application. The one place a new node's size comes from:
 * auto nodes persist no size, resizable nodes start at their layout defaults,
 * manual nodes keep whatever their create() provided.
 */
export function styleForLayout(
  layout: NodeLayout,
  createdStyle: WorkflowNode['style'],
): WorkflowNode['style'] {
  if (layout.mode === 'auto') {
    return withoutSizeKeys(createdStyle);
  }
  if (layout.mode === 'resizable') {
    return { ...createdStyle, width: layout.width, height: layout.height };
  }
  return createdStyle;
}

/**
 * Hydrate-time reconciliation of every size carrier a saved node can hold.
 * React Flow prefers top-level width/height over style, and resize controls
 * write top-level values, so the effective size folds top-level into style
 * first; the definition's hydrateStyle (legacy/manual override) runs before
 * clamping; the result always clears top-level dims and `measured` so the
 * returned `style` is the single persisted authority.
 */
export function normalizeNodeLayout(
  node: WorkflowNode,
  definition: LayoutOwner,
): Pick<WorkflowNode, 'style' | 'width' | 'height' | 'measured'> {
  const mergedStyle: WorkflowNode['style'] = {
    ...node.style,
    width: finiteNumber(node.width) ?? finiteNumber(node.style?.width),
    height: finiteNumber(node.height) ?? finiteNumber(node.style?.height),
  };
  const overriddenStyle = definition.hydrateStyle
    ? definition.hydrateStyle({ ...node, style: mergedStyle, width: undefined, height: undefined })
    : mergedStyle;

  const cleared = { width: undefined, height: undefined, measured: undefined };
  const layout = definition.layout;
  if (layout.mode === 'auto') {
    return { style: withoutSizeKeys(overriddenStyle), ...cleared };
  }
  if (layout.mode === 'manual') {
    return { style: overriddenStyle, ...cleared };
  }

  const savedWidth = finiteNumber(overriddenStyle?.width) ?? layout.width;
  const savedHeight = finiteNumber(overriddenStyle?.height) ?? layout.height;
  const width =
    layout.resizeDirection === 'vertical'
      ? layout.width
      : Math.min(Math.max(savedWidth, layout.minWidth), layout.maxWidth ?? Number.POSITIVE_INFINITY);
  const height = Math.max(savedHeight, layout.minHeight);
  return { style: { ...overriddenStyle, width, height }, ...cleared };
}
