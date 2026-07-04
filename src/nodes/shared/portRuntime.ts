export type RuntimePortDirection = 'input' | 'output';

export function runtimePortValueKey(direction: RuntimePortDirection, handle = 'default') {
  return `${direction}:${handle || 'default'}`;
}
