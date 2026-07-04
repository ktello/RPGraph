/* eslint-disable react-refresh/only-export-components */
import type { SettingsValueDefinition } from '../../types';
import { workflowVariableToken } from '../../workflow';

type WorkflowVariablePickerProps = {
  definitions: SettingsValueDefinition[];
  numberOnly?: boolean;
  onInsert: (token: string) => void;
};

export function WorkflowVariablePicker({
  definitions,
  numberOnly = false,
  onInsert,
}: WorkflowVariablePickerProps) {
  const availableDefinitions = definitions.filter(
    (definition) => !numberOnly || definition.valueKind === 'number',
  );

  if (!availableDefinitions.length) {
    return null;
  }

  return (
    <div className="workflow-variable-picker">
      {availableDefinitions.map((definition) => (
        <button
          className="workflow-variable-chip nodrag"
          key={definition.key}
          type="button"
          title={workflowVariableToken(definition.label)}
          onClick={() => onInsert(workflowVariableToken(definition.label))}
        >
          {definition.label}
        </button>
      ))}
    </div>
  );
}

export function insertWorkflowVariableToken(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
  token: string,
) {
  const selectionStart = element?.selectionStart ?? value.length;
  const selectionEnd = element?.selectionEnd ?? selectionStart;
  const nextValue = `${value.slice(0, selectionStart)}${token}${value.slice(selectionEnd)}`;
  const nextCursor = selectionStart + token.length;
  window.requestAnimationFrame(() => {
    element?.focus();
    element?.setSelectionRange(nextCursor, nextCursor);
  });
  return nextValue;
}
