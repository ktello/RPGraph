import type { WorkflowNode } from '../types';
import {
  currentLocalDateTime,
  normalizeLocalDateTime,
} from '../data-management/historyStore';

export type StructuredInputCommand =
  | {
      type: 'time';
      value: string;
    }
  | {
      type: 'direct';
    };

export type CommandInputCommand = StructuredInputCommand & {
  id: string;
  editing: boolean;
};

export type StructuredInputPayload = {
  commands: StructuredInputCommand[];
  message: string;
};

export const timeCommandExamples = ['+10m', '+1h', '+1d', '13:34', 'tomorrow 09:00'];

export const commandMenuTrigger = '/cmd';
export const defaultTimeCommandValue = '+1h';

export function createTimeCommand(id: string): CommandInputCommand {
  return {
    id,
    type: 'time',
    value: '',
    editing: true,
  };
}

export function createDirectCommand(id: string): CommandInputCommand {
  return {
    id,
    type: 'direct',
    editing: false,
  };
}

export function structuredInputPayload(
  commands: CommandInputCommand[],
  message: string,
): StructuredInputPayload {
  return {
    commands: commands
      .flatMap((command): StructuredInputCommand[] => {
        if (command.type === 'time') {
          const value = command.value.trim() || defaultTimeCommandValue;
          return [{ type: 'time', value }];
        }
        return [{ type: 'direct' }];
      }),
    message,
  };
}

export function commandInputCommandsFromStructured(
  commands: StructuredInputCommand[],
): CommandInputCommand[] {
  return commands.map((command, index) => ({
    ...command,
    id: `restored-command-${Date.now()}-${index}`,
    editing: false,
  }));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateTimeParts(value: string) {
  const normalized = normalizeLocalDateTime(value);
  if (!normalized) {
    return undefined;
  }
  const [, year, month, day, hour, minute] =
    normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/) ?? [];
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

function localDateTimeFromDate(date: Date) {
  return [
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`,
  ].join('T');
}

function addMinutes(value: string, minutes: number) {
  const parts = dateTimeParts(value);
  if (!parts) {
    return undefined;
  }
  return localDateTimeFromDate(new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute + minutes,
  )));
}

function withTime(referenceDateTime: string, hour: number, minute: number, dayOffset = 0) {
  const parts = dateTimeParts(referenceDateTime);
  if (!parts) {
    return undefined;
  }
  return localDateTimeFromDate(new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day + dayOffset,
    hour,
    minute,
  )));
}

function resolveTimeCommandValue(
  value: string,
  referenceDateTime?: string,
): { ok: true; dateTime: string } | { ok: false; error: string } {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  const reference = normalizeLocalDateTime(referenceDateTime) ?? currentLocalDateTime();
  if (!trimmed) {
    return { ok: false, error: 'Time Command needs a value like +1h or tomorrow 09:00.' };
  }

  const relativeMatch = trimmed.match(/^\+(\d+)([mhd])$/i);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2].toLocaleLowerCase();
    const minutes = unit === 'm' ? amount : unit === 'h' ? amount * 60 : amount * 24 * 60;
    const dateTime = addMinutes(reference, minutes);
    return dateTime
      ? { ok: true, dateTime }
      : { ok: false, error: 'Time Command could not resolve the current RP time.' };
  }

  const clockMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (clockMatch) {
    const hour = Number(clockMatch[1]);
    const minute = Number(clockMatch[2]);
    let dateTime = withTime(reference, hour, minute);
    if (dateTime && dateTime < reference) {
      dateTime = withTime(reference, hour, minute, 1);
    }
    return dateTime
      ? { ok: true, dateTime }
      : { ok: false, error: 'Time Command could not resolve that clock time.' };
  }

  const tomorrowMatch = trimmed.match(/^tomorrow\s+([01]?\d|2[0-3]):([0-5]\d)$/i);
  if (tomorrowMatch) {
    const dateTime = withTime(reference, Number(tomorrowMatch[1]), Number(tomorrowMatch[2]), 1);
    return dateTime
      ? { ok: true, dateTime }
      : { ok: false, error: 'Time Command could not resolve tomorrow.' };
  }

  return {
    ok: false,
    error: `Unsupported Time Command value. Try ${timeCommandExamples.join(', ')}.`,
  };
}

export function applyTimeCommandsToWorkflowNodes(
  nodes: WorkflowNode[],
  commands: StructuredInputCommand[],
): { nodes: WorkflowNode[]; appliedDateTime?: string; error?: string } {
  const timeCommands = commands.filter(
    (command): command is Extract<StructuredInputCommand, { type: 'time' }> =>
      command.type === 'time' && command.value.trim().length > 0,
  );
  if (timeCommands.length === 0) {
    return { nodes };
  }
  const historyNode = nodes.find(
    (node) => node.data.kind === undefined &&
      node.data.nodeType === 'history' &&
      node.data.historyTimeTrackingEnabled,
  );
  if (!historyNode) {
    return {
      nodes,
      error: 'Enable RP Time Tracking in Chat History to use Time Command.',
    };
  }

  let nextDateTime = normalizeLocalDateTime(historyNode.data.historyCurrentRpDateTime) ??
    currentLocalDateTime();
  for (const command of timeCommands) {
    const result = resolveTimeCommandValue(command.value, nextDateTime);
    if (!result.ok) {
      return { nodes, error: result.error };
    }
    nextDateTime = result.dateTime;
  }

  return {
    appliedDateTime: nextDateTime,
    nodes: nodes.map((node) =>
      node.id === historyNode.id
        ? {
            ...node,
            data: {
              ...node.data,
              historyCurrentRpDateTime: nextDateTime,
              historyTimeStatus: `RP Time command applied: ${nextDateTime}`,
            },
          }
        : node,
    ),
  };
}
