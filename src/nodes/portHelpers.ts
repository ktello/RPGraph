import type { PortDefinition } from './types';

export function input(
  id: string,
  valueType: PortDefinition['valueType'],
  label: string,
): PortDefinition {
  return { id, direction: 'input', valueType, label };
}

export function output(
  id: string,
  valueType: PortDefinition['valueType'],
  label: string,
): PortDefinition {
  return { id, direction: 'output', valueType, label };
}
