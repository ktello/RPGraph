import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useBackdropDismiss } from '../../components/useBackdropDismiss';
import type { DynamicContextRule, WorkflowNode } from '../../types';
import { useNodeActions } from '../NodeActionsContext';
import { useNodeView } from '../NodeViewContext';
import { ConnectionSelect } from '../shared/ConnectionSelect';
import { NodeCustomSelect } from '../shared/NodeCustomSelect';
import { LlmCallMetrics, runStateClassName, useNodeLayoutSync } from '../shared/CardView';
import { PortLabel } from '../shared/PortValue';
import { storybookImageListsFromNodes, storyCharactersFromNodes } from '../../storybook/runtime';
import { dynamicContextPorts } from './execute';
import { storybookImageContextRuleSpecs } from './storybookImageRules';
import { parseNodeStorybookJson } from '../rp-storybook-v1/model';

const storybookImageRuleIdPrefix = 'storybook-image-list-rule:';

function dynamicContextRules(data: WorkflowNode['data']): DynamicContextRule[] {
  return Array.isArray(data.dynamicContextRules) ? data.dynamicContextRules : [];
}

function createRuleId() {
  return `dynamic-context-rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function matchedRuleIndexes(data: WorkflowNode['data']) {
  return Array.isArray(data.dynamicContextMatchedRuleIndexes)
    ? data.dynamicContextMatchedRuleIndexes.filter((entry) => Number.isInteger(entry) && entry > 0)
    : [];
}

function syncedImageListRules(
  rules: DynamicContextRule[],
  specs: ReturnType<typeof storybookImageContextRuleSpecs>,
  enabled: boolean,
) {
  if (!enabled) {
    const nextRules = rules.filter((rule) => !rule.id.startsWith(storybookImageRuleIdPrefix));
    return nextRules.length === rules.length ? rules : nextRules;
  }

  const specsById = new Map(specs.map((spec) => [spec.id, spec]));
  let changed = false;
  const nextRules = rules.flatMap((rule) => {
    if (!rule.id.startsWith(storybookImageRuleIdPrefix)) {
      return [rule];
    }
    const spec = specsById.get(rule.id);
    if (!spec) {
      changed = true;
      return [];
    }
    const nextRule: DynamicContextRule = {
      ...rule,
      conditionText: spec.conditionText,
      contextId: spec.contextId,
      contextPlacement: rule.contextPlacement ?? 'after',
    };
    if (
      nextRule.conditionText !== rule.conditionText ||
      nextRule.contextId !== rule.contextId ||
      nextRule.contextPlacement !== rule.contextPlacement
    ) {
      changed = true;
    }
    return [nextRule];
  });

  specs.forEach((spec) => {
    if (nextRules.some((rule) => rule.id === spec.id)) {
      return;
    }
    nextRules.push({
      id: spec.id,
      conditionText: spec.conditionText,
      contextId: spec.contextId,
      contextPlacement: 'after',
    });
    changed = true;
  });

  return changed ? nextRules : rules;
}

export function DynamicContextInjectionNodeCard({ id, data }: NodeProps<WorkflowNode>) {
  const nodeBodyRef = useNodeLayoutSync(id);
  const actions = useNodeActions();
  const view = useNodeView();
  const [showConfig, setShowConfig] = useState(false);
  const configBackdropDismiss = useBackdropDismiss<HTMLDivElement>(() => setShowConfig(false));
  const [collapsedRuleIds, setCollapsedRuleIds] = useState<Record<string, boolean>>({});
  const rules = dynamicContextRules(data);
  const autoImageRulesEnabled = data.dynamicContextImageRulesEnabled !== false;
  const storyCharacters = storyCharactersFromNodes(view.nodes);
  const storybookImageLists = storybookImageListsFromNodes(view.nodes);
  const matchedIndexes = matchedRuleIndexes(data);
  const matchedIndexSet = new Set(matchedIndexes);

  const contextOptions = [
    { value: '', label: 'Dummy context only' },
    ...storyCharacters.map((character) => ({
      value: character.id,
      label: `Charakter: ${character.label}`,
    })),
    ...storybookImageLists.map((imageList) => ({
      value: imageList.id,
      label: `Image List: ${imageList.label}`,
    })),
  ];

  const placementOptions = [
    { value: 'after', label: 'Below Text' },
    { value: 'before', label: 'Above Text' },
  ] as const;
  const imageRuleSpecs = view.nodes.flatMap((node) => {
    if (node.data.kind !== undefined || node.data.nodeType !== 'rp-storybook-v1') {
      return [];
    }
    const storybook = parseNodeStorybookJson(node.data.storybookJson);
    return storybook ? storybookImageContextRuleSpecs(node.id, storybook) : [];
  });

  const updateRules = (nextRules: DynamicContextRule[]) => {
    actions.updateData(id, { dynamicContextRules: nextRules });
  };

  const addRule = () => {
    const newId = createRuleId();
    updateRules([
      ...rules,
      {
        id: newId,
        conditionText: '',
        contextId: '',
        contextPlacement: 'after',
      },
    ]);
    setCollapsedRuleIds((prev) => ({ ...prev, [newId]: false }));
  };

  const toggleCollapseRule = (ruleId: string) => {
    setCollapsedRuleIds((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const allCollapsed = rules.length > 0 && rules.every((r) => collapsedRuleIds[r.id]);
  const toggleCollapseAll = () => {
    if (allCollapsed) {
      setCollapsedRuleIds({});
    } else {
      const nextCollapsed: Record<string, boolean> = {};
      rules.forEach((r) => {
        nextCollapsed[r.id] = true;
      });
      setCollapsedRuleIds(nextCollapsed);
    }
  };

  const updateRule = (ruleId: string, patch: Partial<DynamicContextRule>) => {
    updateRules(rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (ruleId: string) => {
    updateRules(rules.filter((rule) => rule.id !== ruleId));
  };

  const toggleAutoImageRules = (enabled: boolean) => {
    actions.updateData(id, {
      dynamicContextImageRulesEnabled: enabled,
      dynamicContextRules: syncedImageListRules(rules, imageRuleSpecs, enabled),
    });
  };

  useEffect(() => {
    if (!autoImageRulesEnabled) {
      return;
    }
    const nextRules = syncedImageListRules(rules, imageRuleSpecs, true);
    if (nextRules !== rules) {
      actions.updateData(id, { dynamicContextRules: nextRules });
    }
  }, [actions, autoImageRulesEnabled, id, imageRuleSpecs, rules]);

  return (
    <div className={`workflow-node dynamic-context-node${runStateClassName(data)}`} ref={nodeBodyRef}>
      <div className="node-title-row">
        <span className="node-dot" />
        <strong>{data.label}</strong>
      </div>
      <LlmCallMetrics data={data} />
      <span className="node-description">{data.description}</span>
      <ConnectionSelect id={id} label="LLM CONNECTION" connectionId={data.connectionId} />
      <button className="load-text-button dynamic-context-config-button nodrag" type="button" onClick={() => setShowConfig(true)}>
        Configure Context
      </button>
      <div className="dynamic-context-port-grid">
        {dynamicContextPorts.map((port) => (
          <div className="dynamic-context-port-row" key={port.id}>
            <div className="workflow-port workflow-port-input dynamic-context-port">
              <Handle id={port.id} type="target" position={Position.Left} />
              <PortLabel
                data={data}
                direction="input"
                handle={port.id}
                label={port.inputLabel}
                valueType={port.valueType}
              />
            </div>
            <div className="workflow-port workflow-port-output dynamic-context-port">
              <PortLabel
                data={data}
                direction="output"
                handle={port.id}
                label={port.outputLabel}
                valueType={port.valueType}
              />
              <Handle id={port.id} type="source" position={Position.Right} />
            </div>
          </div>
        ))}
      </div>
      <span className="run-note dynamic-context-status">{data.preview}</span>
      <div className="node-actions dynamic-context-actions">
        <button
          className="inspect-button nodrag"
          type="button"
          disabled={!data.fullText}
          onClick={() => actions.textPreview(id)}
        >
          Text Preview
        </button>
      </div>
      {showConfig && typeof document !== 'undefined' && createPortal(
        <div className="dialog-backdrop" {...configBackdropDismiss}>
          <section
            className="dynamic-context-dialog nodrag"
            role="dialog"
            aria-modal="true"
            aria-label="Configure Dynamic Context"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="dialog-title-row">
              <div>
                <span className="eyebrow">DYNAMIC CONTEXT</span>
                <h2>Configure Context</h2>
              </div>
              <button type="button" onClick={() => setShowConfig(false)}>
                Close
              </button>
            </div>
            <div className="dynamic-context-dialog-body">
              <div className="dynamic-context-dialog-toolbar">
                <button className="load-text-button nodrag" type="button" onClick={addRule}>
                  + Add Context Rule
                </button>
                {rules.length > 0 && (
                  <button
                    className="load-text-button collapse-all-button nodrag"
                    type="button"
                    onClick={toggleCollapseAll}
                  >
                    {allCollapsed ? 'Expand All Rules' : 'Collapse All Rules'}
                  </button>
                )}
                <label
                  className="dynamic-context-auto-rule"
                  title="Keep Storybook image-list context rules synced in this node. When described images appear later, matching Image List rules are created automatically."
                >
                  <input
                    className="nodrag"
                    type="checkbox"
                    checked={autoImageRulesEnabled}
                    onChange={(event) => toggleAutoImageRules(event.currentTarget.checked)}
                  />
                  Automatic Image List Rules
                </label>
              </div>
              <div className="dynamic-context-rule-list">
                {rules.length === 0 ? (
                  <div className="dynamic-context-empty-state">
                    Add a rule to describe when extra context should later be attached to Text Output.
                  </div>
                ) : rules.map((rule, index) => {
                  const isCollapsed = collapsedRuleIds[rule.id] ?? false;
                  const isMatched = matchedIndexSet.has(index + 1);
                  
                  // Find selected context label for collapsed view preview
                  const selectedChar = storyCharacters.find((c) => c.id === rule.contextId);
                  const selectedImg = storybookImageLists.find((i) => i.id === rule.contextId);
                  let contextLabel = 'Dummy context';
                  if (selectedChar) {
                    contextLabel = `Char: ${selectedChar.label}`;
                  } else if (selectedImg) {
                    contextLabel = `Img: ${selectedImg.label}`;
                  }
                  const placementLabel = rule.contextPlacement === 'before' ? 'Above' : 'Below';

                  return (
                    <article
                      className={`dynamic-context-rule-card${isCollapsed ? ' collapsed' : ''}`}
                      key={rule.id}
                    >
                      {isCollapsed ? (
                        <div
                          className="dynamic-context-rule-collapsed-header nodrag"
                          onClick={() => toggleCollapseRule(rule.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="collapsed-left-section">
                            <span className="collapse-toggle-icon">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }}>
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            </span>
                            <strong className="rule-index-label">Rule {index + 1}</strong>
                            {isMatched && (
                              <span className="dynamic-context-rule-active">Activated</span>
                            )}
                            <span className="collapsed-rule-condition-preview" title={rule.conditionText}>
                              {rule.conditionText.trim()
                                ? (rule.conditionText.length > 55 ? rule.conditionText.slice(0, 55) + '...' : rule.conditionText)
                                : 'No condition set...'}
                            </span>
                          </div>

                          <div className="collapsed-right-section">
                            <span className="collapsed-rule-context-target">
                              <span className="arrow-indicator">➔</span>
                              <span className="context-name">{contextLabel}</span>
                              <span className="placement-badge">({placementLabel})</span>
                            </span>
                            <button
                              className="inspect-button remove-rule-btn nodrag"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeRule(rule.id);
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="dynamic-context-rule-expanded-layout">
                          <div className="rule-column-left">
                            <div
                              className="dynamic-context-rule-header nodrag"
                              onClick={() => toggleCollapseRule(rule.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="dynamic-context-rule-title">
                                <span className="collapse-toggle-icon">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m6 9 6 6 6-6"/>
                                  </svg>
                                </span>
                                <strong>Rule {index + 1}</strong>
                                {isMatched && (
                                  <span className="dynamic-context-rule-active">Activated this Turn</span>
                                )}
                              </div>
                            </div>
                            <div className="rule-settings-group">
                              <div className="field-row">
                                <label className="node-field-label" htmlFor={`${rule.id}-context`}>
                                  CONTEXT TARGET
                                </label>
                                <NodeCustomSelect
                                  id={`${rule.id}-context`}
                                  value={rule.contextId}
                                  onChange={(val) => updateRule(rule.id, { contextId: val })}
                                  options={contextOptions}
                                />
                              </div>

                              <div className="field-row">
                                <label className="node-field-label" htmlFor={`${rule.id}-placement`}>
                                  PLACEMENT
                                </label>
                                <NodeCustomSelect
                                  id={`${rule.id}-placement`}
                                  value={rule.contextPlacement ?? 'after'}
                                  onChange={(val) => updateRule(rule.id, { contextPlacement: val })}
                                  options={placementOptions}
                                />
                              </div>
                            </div>

                            <div className="rule-card-actions">
                              <button
                                className="inspect-button remove-rule-btn nodrag"
                                type="button"
                                onClick={() => removeRule(rule.id)}
                              >
                                Remove Rule
                              </button>
                              <label className="node-field-label condition-label-left" htmlFor={`${rule.id}-condition`}>
                                CONDITION ➔
                              </label>
                            </div>
                          </div>

                          <div className="rule-column-right">
                            <textarea
                              className="node-textarea nodrag nowheel rule-condition-textarea"
                              id={`${rule.id}-condition`}
                              value={rule.conditionText}
                              placeholder="Example: If this text is about Lara, attach Lara's character context."
                              onChange={(event) => updateRule(rule.id, { conditionText: event.currentTarget.value })}
                            />
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
