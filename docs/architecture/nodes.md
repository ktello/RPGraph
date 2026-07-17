# Nodes

## Model

- No class inheritance. Node types are plain-object definitions held in a registry and rendered by one component.
- Two shared spines: a definition interface (behavior) and a discriminated-union data type (state).
- Every graph node is React Flow `type: 'workflow'`. Node-type identity lives in `data.nodeType`.

## Definition

Type: `NodeCreationDefinition` (`src/nodes/types.ts`). Core nodes use the narrowed `CoreNodeCreationDefinition` (`type: CoreNodeType`, `origin: 'core'`).

| Field | Type | Role |
| --- | --- | --- |
| `type` | `NodeTypeId` | Registry key. |
| `dataVersion` | `` `${number}.${number}.${number}` `` | Node data version. |
| `label`, `description`, `menuDescription` | `string` | Display + palette text. |
| `origin` | `'core' \| 'plugin'` | Provenance. |
| `ports` | `(data) => PortDefinition[]` | Ports, computed per render. |
| `create` | `(ctx) => WorkflowNode` | New-instance factory. |
| `Component` | `ComponentType<NodeProps<WorkflowNode>>` | Per-type card. |
| `execute` | `(node, ctx) => Promise<string>` | Runtime behavior. |
| `saveData` / `hydrateData` | `(data[, ctx]) => data` | Persistence normalizers. |
| `layout` | `NodeLayout` | Boundary sizing authority (auto / resizable / manual). |
| `hydrateStyle?` | `(node) => node.style` | Legacy/manual style override consulted by the layout normalizer. |
| `singleton?` | `boolean` | Max one instance. |
| `usesLlm?` | `boolean` | Node issues LLM calls. |
| `contributesToTokenCalibration?` | `boolean` | Feeds token metrics. |
| `requiresPostOutputPermission?` | `boolean` | Gated in post-output runs. |
| `requiresPreparedInputEdge?` | `boolean` | Prepared only with a qualifying input edge. |
| `passiveRuntime?` | `boolean` | Not blocked by pending user input. |

Core definitions are object literals in `coreNodeCreationDefinitions` (`src/nodes/coreDefinitions.ts`). `saveData`/`hydrateData` are attached from `corePersistence` (`src/nodes/corePersistence.ts`) to produce the exported `coreNodeDefinitions`.

## Registry

`src/nodes/registry.ts` — `Map<NodeTypeId, NodeCreationDefinition>`.

- `registerNode(def)` validates then inserts. Rejections (throw):
  - `dataVersion` not `MAJOR.MINOR.PATCH`.
  - `origin: 'plugin'` without a namespaced `owner/name` type id.
  - Duplicate `type` id.
- `registerCoreNodes()` is idempotent; registers `coreNodeDefinitions` at module load.
- Lookups: `getRegisteredNode`, `getRegisteredCoreNode`, `getRegisteredCoreNodes`, `isRegisteredCoreNodeType`.

## Instance

`WorkflowNode = Node<WorkflowNodeData>` (React Flow). Validated by `isWorkflowNode` (`src/workflow/validation.ts`).

Top-level fields: `id`, `type: 'workflow'`, `position {x,y}`, `style?`, `width?`/`height?`, `measured?`, `selected?`/`dragging?`/`resizing?`, `data`.

## Data

Type: `WorkflowNodeData` (`src/types.ts`). Discriminated union.

Discriminants:
- `nodeType` — string literal.
- `kind` — `undefined` for core nodes; `'missing-plugin-node'` or `'incompatible-core-node'` for placeholders.

Base: `WorkflowNodeCommonFields` — one flat interface.
- Required: `label`, `description`, `preview`.
- Optional (~112 fields): run state (`runActive`, `runVisionActive`, `runCompleted`, `runPrepared`, `runError`, `runtimePortValues`), version (`nodeDataVersion`, `currentNodeVersion`), `portsSnapshot`, and every per-feature field (e.g. `llmPromptBefore`, `textReplaceEntries`, `combinerInputCount`, `storybookJson`).

Core variant shape:
```
CoreWorkflowNodeCommonFields = WorkflowNodeCommonFields & { kind?: undefined; storedData?: undefined }
<XxxNodeData>              = CoreWorkflowNodeCommonFields & { nodeType: 'xxx' }
```
- Variants add only the `nodeType` discriminant. Exceptions: `memory-slot` requires `memorySlotName`/`memorySlotText`/`memorySlotMode`; `last-user-input`/`last-rp-output` re-declare `includeRpDateTime`.
- Union of all core variants: `ConcreteCoreWorkflowNodeData`.

Placeholder variants:
- `MissingNodeWorkflowData` — `kind: 'missing-plugin-node'`, `storedData`, `portsSnapshot`.
- `IncompatibleCoreNodeWorkflowData` — `kind: 'incompatible-core-node'`, `nodeDataVersion`, `currentNodeVersion`, `storedData`.

Full union:
```
WorkflowNodeData = ConcreteCoreWorkflowNodeData | MissingNodeWorkflowData | IncompatibleCoreNodeWorkflowData
```

Parallel typing: `src/nodes/types.ts` defines generic `SharedNodeData<TType>`, `StoredNodeData<TType, TConfig>`, `NodeDefinition<TType, TConfig, TData>`. The runtime React Flow store holds the flat `WorkflowNodeData` (`src/types.ts`), not the generic form.

## Ports

Resolution — `nodePorts` (`src/graph/portCompatibility.ts`):
- `kind === undefined` (core): `getRegisteredNode(nodeType).ports(data)` — computed.
- `kind !== undefined` (plugin/placeholder): `data.portsSnapshot` — stored.

`PortDefinition = PortSnapshot = { id, direction: 'input' | 'output', valueType, label, multiple? }`.

Compatibility — `arePortTypesCompatible` (`src/graph/portCompatibility.ts`):
- `image` connects to `image` only.
- `mixed` input accepts `text`/`json`/`mixed`/`number`/`boolean`.
- Equal types connect.

## Rendering

Single React Flow node type: `nodeTypes = { workflow: WorkflowNodeRenderer }` (`src/App.tsx`).

Dispatch — `WorkflowNodeRenderer` (`src/nodes/WorkflowNodeRenderer.tsx`):
1. `kind: 'incompatible-core-node'` → `IncompatibleCoreNodeCard`.
2. `kind: 'missing-plugin-node'` or unregistered type → `MissingNodeCard`.
3. Otherwise → `definition.Component`.

Shared card behavior (composition): `useNodeLayoutSync`, `runStateClassName`, `LlmCallMetrics` (`src/nodes/shared/CardView.tsx`); contexts `useNodeActions`, `useNodeView`.

## Sizing

Authority: the definition's required `layout` descriptor (`NodeLayout`, `src/nodes/nodeLayout.ts`; values in `coreNodeLayouts`). Modes:
- `auto { width }` — card painted at `width` via the `--node-card-width` CSS variable (injected by `WorkflowNodeRenderer` for live cards only; placeholders keep their own widths). Height hugs content. No persisted size; the interaction wrapper measures the card.
- `resizable { width, height, minWidth, minHeight, maxWidth?, resizeDirection? }` — persisted `style` is the wrapper authority; the card fills it (`width:100%; height:100%` CSS). `NodeResizeControl` bounds read from the layout. `resizeDirection: 'vertical'` locks width.
- `manual` — the definition's `create()`/`hydrateStyle` own the style (`memory-slot` wire links).

Two boxes per node:
- Painted card: `.workflow-node` (`src/styles.css`), base `width: var(--node-card-width, 365px)`. No per-type pixel-width rules.
- Interaction wrapper (React Flow node element): React Flow prefers top-level `node.width`/`node.height` over `style`; resize controls write top-level values.

Pipeline:
- Create: `create()` bodies carry no size styles; the definition-stamping pass in `coreDefinitions.ts` applies `styleForLayout(layout)` (auto → none; resizable → defaults; manual → pass-through).
- Hydrate: `normalizeNodeLayout` (`src/app/workflowHydration.ts`) reconciles all three size carriers (`style`, top-level `width`/`height`, `measured`): auto → strip all; resizable → clamp the effective size (top-level preferred) to layout bounds, write to `style`, clear the rest. `style` is the single persisted authority after load.
- `hydrateStyle` (optional) is a legacy/manual override consulted by the normalizer pre-clamp. Defined only for: `text-preview` (legacy 390×350 → defaults migration), `memory-slot` (wire-link mode styles).
- Starter workflow seeds (`src/workflow/defaults.ts`) read `coreNodeLayouts`.
- `useNodeLayoutSync` re-measures the card (`updateNodeInternals`); it never writes back to `style`.
- Placeholder nodes: hydration strips saved `width`/`height`/`measured`; the wrapper re-measures to the placeholder card. The `--node-card-width` variable is never set for them.

Containment: port handles intentionally overhang the card edge (−15/−16/−28px offsets), so `.workflow-node` MUST NOT clip via `overflow: hidden`. Non-handle content stays within the card rect (regression-tested in `test/e2e/nodeSizing.spec.ts`).

## Persistence

- `create()` returns a full node with a `data` literal.
- `saveData`/`hydrateData`: per-type normalizers in `corePersistence` (`src/nodes/corePersistence.ts`). `baseData`/`preservedData` rebuild `data` from `{nodeType, label, description, preview}` plus type-relevant fields; stamp `nodeDataVersion = definition.dataVersion`.
- Routing — `persistentNodeData`/`hydrateNodeData` (`src/workflow/persistence.ts`): placeholder nodes clone `storedData`; core nodes dispatch to the definition.
- Validation — `isWorkflowNodeData` (`src/workflow/validation.ts`), single guard. Order:
  1. Base fields (`label`/`description`/`preview`/`nodeType`/`nodeDataVersion`).
  2. Unknown type → missing-plugin (requires valid `portsSnapshot`).
  3. Core but version-incompatible → preserved as-is.
  4. Otherwise validate optional fields by shape.

## Versioning

- `dataVersion`: `MAJOR.MINOR.PATCH`. Current values: `currentCoreNodeVersions` (`src/nodes/nodeVersion.ts`).
- Compatibility — `areNodeVersionsCompatible` (`src/nodes/nodeVersion.ts`): MAJOR and MINOR must match; PATCH ignored.
- Incompatible stored version → `kind: 'incompatible-core-node'`; `storedData` preserved for upgrade.
- Core type ids: `coreNodeTypes` tuple (`src/nodes/coreNodeTypes.ts`).

## Registration points (per new core node type)

Compile-enforced:
- `coreNodeTypes` tuple (`src/nodes/coreNodeTypes.ts`).
- `currentCoreNodeVersions` (`src/nodes/nodeVersion.ts`).
- `coreNodeLayouts` entry (`src/nodes/nodeLayout.ts`).
- `corePersistence` record (`src/nodes/corePersistence.ts`).
- Data union variant in `ConcreteCoreWorkflowNodeData` (`src/types.ts`).
- Creation definition in `coreNodeCreationDefinitions` (`src/nodes/coreDefinitions.ts`).

Not compile-enforced:
- Palette entry (`src/app/useNodePalette.ts`).
- `fullText` dialog whitelist, if the node opens one (`src/dialogs/StudioDialogs.tsx`).
- CSS class (`src/styles.css`).
- New data fields in `isWorkflowNodeData` (`src/workflow/validation.ts`).

## Invariants

- Load validates fully, then commits atomically; incompatible or corrupt nodes are preserved as placeholders, never coerced.
- Node data media URLs use the `data:` scheme only.
- Custom-node code runs in a Web Worker inside a sandboxed iframe (opaque origin, deny-all CSP, no file/network/Electron access, postMessage only) — `src/nodes/custom-node/sandbox.ts`.
- Plugin node type ids are namespaced `owner/name`.
- `singleton` node types allow one instance; the constraint is enforced at add time.

## Reference files

| Concern | File |
| --- | --- |
| Definition & port types | `src/nodes/types.ts` |
| Core definitions | `src/nodes/coreDefinitions.ts` |
| Registry | `src/nodes/registry.ts` |
| Core type ids | `src/nodes/coreNodeTypes.ts` |
| Versions & compatibility | `src/nodes/nodeVersion.ts` |
| Persistence table | `src/nodes/corePersistence.ts` |
| Data union | `src/types.ts` |
| Renderer & dispatch | `src/nodes/WorkflowNodeRenderer.tsx`, `src/App.tsx` |
| Shared card behavior | `src/nodes/shared/CardView.tsx` |
| Ports & compatibility | `src/graph/portCompatibility.ts` |
| Persistence routing | `src/workflow/persistence.ts` |
| Validation | `src/workflow/validation.ts` |
| Hydration & size strip | `src/app/workflowHydration.ts` |
| Styles | `src/styles.css` |
