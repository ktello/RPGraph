import { coreNodeTypes } from '../coreNodeTypes';

const coreNodeTypeSet = new Set<string>(coreNodeTypes);

export function isNamespacedPluginTypeId(type: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(type);
}

export function isMissingPluginTypeId(type: string) {
  // A namespaced type id that is not a known core type — i.e. a plugin node
  // whose definition is not currently registered. Uses the leaf coreNodeTypes
  // tuple (never coreDefinitions) to stay out of the definition import cycle.
  return !coreNodeTypeSet.has(type) && isNamespacedPluginTypeId(type);
}
