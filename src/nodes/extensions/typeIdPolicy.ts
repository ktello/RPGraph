import { coreNodeDefinitions } from '../coreDefinitions';

export function isNamespacedPluginTypeId(type: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(type);
}

export function isMissingPluginTypeId(type: string) {
  return !coreNodeDefinitions.some((definition) => definition.type === type) &&
    isNamespacedPluginTypeId(type);
}
