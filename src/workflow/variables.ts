import type { SettingsValueDefinition, WorkflowVariableSetCommand } from '../types';
import {
  contextLengthMaxOptionKey,
  defaultContextCompressionTokenLimit,
  responseLengthOptionKey,
} from './defaults';

export type WorkflowVariableValues = Record<string, string>;

export type { WorkflowVariableSetCommand };

const workflowVariableOpen = '<';
const workflowVariableClose = '>';

export const builtInWorkflowVariables: SettingsValueDefinition[] = [
  {
    key: contextLengthMaxOptionKey,
    label: 'Context Length Max',
    enabled: true,
    builtIn: true,
    valueKind: 'number',
    used: false,
    usedAsNumber: false,
  },
  {
    key: responseLengthOptionKey,
    label: 'Response Length',
    enabled: true,
    builtIn: true,
    valueKind: 'text',
    used: false,
    usedAsNumber: false,
  },
];

export function defaultWorkflowVariableValue(key: string) {
  if (key === contextLengthMaxOptionKey) {
    return String(defaultContextCompressionTokenLimit);
  }
  if (key === responseLengthOptionKey) {
    return '200-300';
  }
  return '';
}

export function workflowVariableToken(label: string) {
  return `${workflowVariableOpen}${label.trim()}${workflowVariableClose}`;
}

function isStrictNumberText(value: string) {
  return /^-?(?:\d+|\d*\.\d+)$/.test(value.trim());
}

export function workflowVariableValueKind(value: string): 'number' | 'text' {
  return isStrictNumberText(value) ? 'number' : 'text';
}

function unescapeSetStringValue(value: string) {
  return value.replace(/\\(["\\nt])/g, (_, escaped: string) => {
    if (escaped === 'n') {
      return '\n';
    }
    if (escaped === 't') {
      return '\t';
    }
    return escaped;
  });
}

function parseSetValue(rawValue: string) {
  const value = rawValue.trim();
  const quoted = /^"((?:\\.|[^"\\])*)"$/.exec(value);
  return quoted ? unescapeSetStringValue(quoted[1]) : value;
}

function parseSetAssignment(line: string): WorkflowVariableSetCommand | undefined {
  const match = /^([^=@][^=]*?)\s*=\s*(.+)$/.exec(line.trim());
  if (!match) {
    return undefined;
  }
  const name = match[1].trim();
  if (!name) {
    return undefined;
  }
  return {
    name,
    value: parseSetValue(match[2]),
  };
}

export function parseWorkflowVariableSetCommands(text: string): WorkflowVariableSetCommand[] {
  // User/LLM-facing syntax:
  // @set
  // Variable Name = "Value"
  // Number Variable = 12
  // @endset
  // Also supports one-line assignments like: @set Current Location = "Old Harbor"
  const commands: WorkflowVariableSetCommand[] = [];
  const pendingBlockCommands: WorkflowVariableSetCommand[] = [];
  let inSetBlock = false;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }
    if (line === '@set') {
      inSetBlock = true;
      pendingBlockCommands.length = 0;
      return;
    }
    if (line === '@endset') {
      if (inSetBlock) {
        commands.push(...pendingBlockCommands);
      }
      inSetBlock = false;
      pendingBlockCommands.length = 0;
      return;
    }
    if (inSetBlock) {
      const command = parseSetAssignment(line);
      if (command) {
        pendingBlockCommands.push(command);
      }
      return;
    }
    if (line.startsWith('@set ')) {
      const command = parseSetAssignment(line.slice('@set '.length));
      if (command) {
        commands.push(command);
      }
    }
  });

  return commands;
}

export function extractWorkflowVariableSetCommands(text: string): {
  text: string;
  commands: WorkflowVariableSetCommand[];
} {
  const commands: WorkflowVariableSetCommand[] = [];
  const outputLines: string[] = [];
  const pendingBlockCommands: WorkflowVariableSetCommand[] = [];
  const pendingBlockLines: string[] = [];
  let inSetBlock = false;

  text.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!inSetBlock && line === '@set') {
      inSetBlock = true;
      pendingBlockCommands.length = 0;
      pendingBlockLines.length = 0;
      pendingBlockLines.push(rawLine);
      return;
    }
    if (inSetBlock) {
      pendingBlockLines.push(rawLine);
      if (line === '@endset') {
        commands.push(...pendingBlockCommands);
        inSetBlock = false;
        pendingBlockCommands.length = 0;
        pendingBlockLines.length = 0;
        return;
      }
      const command = parseSetAssignment(line);
      if (command) {
        pendingBlockCommands.push(command);
      }
      return;
    }
    if (line.startsWith('@set ')) {
      const command = parseSetAssignment(line.slice('@set '.length));
      if (command) {
        commands.push(command);
        return;
      }
    }
    outputLines.push(rawLine);
  });

  if (inSetBlock) {
    outputLines.push(...pendingBlockLines);
  }

  return {
    text: outputLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    commands,
  };
}

export function workflowVariablePreviewValues(
  commands: WorkflowVariableSetCommand[],
  definitions: Pick<SettingsValueDefinition, 'key' | 'label'>[],
  values: WorkflowVariableValues,
) {
  const previewValues = { ...values };
  commands.forEach((command) => {
    const name = command.name.trim();
    if (!name) {
      return;
    }
    const normalizedName = name.toLocaleLowerCase();
    const definition = definitions.find(
      (entry) =>
        entry.key.toLocaleLowerCase() === normalizedName ||
        entry.label.toLocaleLowerCase() === normalizedName,
    );
    const existingCustomKey = Object.keys(previewValues).find(
      (key) => key.toLocaleLowerCase() === normalizedName,
    );
    previewValues[definition?.key ?? existingCustomKey ?? name] = command.value;
  });
  return previewValues;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const escapedWorkflowVariableSentinel = '\uE000RPGRAPH_ESCAPED_WORKFLOW_VARIABLE_';

function workflowVariablePattern(alias: string, escaped = true) {
  return `${escaped ? '(?<!\\\\)' : ''}${escapeRegExp(workflowVariableOpen)}\\s*${escapeRegExp(alias)}\\s*${escapeRegExp(workflowVariableClose)}`;
}

export function variableAliases(definition: Pick<SettingsValueDefinition, 'key' | 'label'>) {
  return [definition.label, definition.key]
    .map((value) => value.trim())
    .filter(Boolean);
}

export function textReferencesWorkflowVariable(
  text: string,
  definition: Pick<SettingsValueDefinition, 'key' | 'label'>,
) {
  return variableAliases(definition).some((alias) =>
    new RegExp(workflowVariablePattern(alias), 'i')
      .test(text),
  );
}

export function textSetsWorkflowVariable(
  text: string,
  definition: Pick<SettingsValueDefinition, 'key' | 'label'>,
) {
  const aliases = new Set(
    variableAliases(definition).map((alias) => alias.toLocaleLowerCase()),
  );
  return parseWorkflowVariableSetCommands(text).some((command) =>
    aliases.has(command.name.trim().toLocaleLowerCase()),
  );
}

export function resolveWorkflowVariables(
  text: string,
  definitions: Pick<SettingsValueDefinition, 'key' | 'label'>[],
  values: WorkflowVariableValues,
) {
  const escapedTokens: string[] = [];
  const withEscapedTokensProtected = definitions.reduce((protectedText, definition) =>
    variableAliases(definition).reduce(
      (currentText, alias) =>
        currentText.replace(
          new RegExp(`\\\\${workflowVariablePattern(alias, false)}`, 'gi'),
          (token) => {
            const index = escapedTokens.length;
            escapedTokens.push(token.slice(1));
            return `${escapedWorkflowVariableSentinel}${index}\uE001`;
          },
        ),
      protectedText,
    ), text);
  const resolved = definitions.reduce((resolvedText, definition) => {
    const value = values[definition.key] ?? defaultWorkflowVariableValue(definition.key);
    return variableAliases(definition).reduce(
      (currentText, alias) =>
        currentText.replace(
          new RegExp(workflowVariablePattern(alias), 'gi'),
          value,
        ),
      resolvedText,
    );
  }, withEscapedTokensProtected);
  return escapedTokens.reduce(
    (currentText, token, index) =>
      currentText.replace(`${escapedWorkflowVariableSentinel}${index}\uE001`, token),
    resolved,
  );
}

export function resolveWorkflowNumber(
  value: string | number | undefined,
  definitions: Pick<SettingsValueDefinition, 'key' | 'label'>[],
  values: WorkflowVariableValues,
) {
  const text = typeof value === 'number' ? String(value) : value ?? '';
  const resolved = resolveWorkflowVariables(text, definitions, values).trim();
  if (!isStrictNumberText(resolved)) {
    return undefined;
  }
  const numberValue = Number(resolved);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}
