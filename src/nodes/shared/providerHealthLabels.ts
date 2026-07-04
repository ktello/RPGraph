import type { ConnectionPreset, ProviderConnectionHealth } from '../../types';

export function providerOption(connection: ConnectionPreset, health?: ProviderConnectionHealth) {
  return {
    value: connection.id,
    label: connection.label,
    status: health?.status ?? 'unknown',
  };
}
