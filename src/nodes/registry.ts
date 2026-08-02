import { coreNodeDefinitions } from './coreDefinitions';
import { isNamespacedPluginTypeId } from './extensions/typeIdPolicy';
import { isNodeVersion } from './nodeVersion';
import type {
  CoreNodeCreationDefinition,
  NodeCreationDefinition,
  NodeTypeId,
} from './types';

const nodeRegistry = new Map<NodeTypeId, NodeCreationDefinition>();
let coreNodesRegistered = false;

export function registerNode(definition: NodeCreationDefinition) {
  if (!isNodeVersion(definition.dataVersion)) {
    throw new Error(`Node version must use MAJOR.MINOR.PATCH: ${definition.type}`);
  }
  if (definition.origin === 'plugin' && !isNamespacedPluginTypeId(definition.type)) {
    throw new Error(`Plugin node type must be namespaced: ${definition.type}`);
  }
  if (nodeRegistry.has(definition.type)) {
    throw new Error(`Node type is already registered: ${definition.type}`);
  }
  nodeRegistry.set(definition.type, definition);
}

// Registration is lazy (first lookup) rather than a module-scope side effect, so
// importing the registry during a definition import cycle never triggers reading
// the folder definitions before they finish evaluating. The latch is set only
// after the whole batch registers; a failing definition rolls back this call's
// insertions and leaves the latch unset, so every subsequent lookup rethrows the
// root cause instead of silently reading a half-populated map. Rollback deletes
// only types inserted by this call, never a pre-registered plugin id that caused
// the duplicate.
export function registerCoreNodes() {
  if (coreNodesRegistered) {
    return;
  }
  const inserted: NodeTypeId[] = [];
  try {
    for (const definition of coreNodeDefinitions()) {
      registerNode(definition);
      inserted.push(definition.type);
    }
  } catch (error) {
    inserted.forEach((type) => nodeRegistry.delete(type));
    throw error;
  }
  coreNodesRegistered = true;
}

export function getRegisteredNode(type: string) {
  registerCoreNodes();
  return nodeRegistry.get(type);
}

export function getRegisteredCoreNode(type: string) {
  registerCoreNodes();
  return nodeRegistry.get(type) as CoreNodeCreationDefinition | undefined;
}

export function getRegisteredCoreNodes() {
  registerCoreNodes();
  return coreNodeDefinitions().map((definition) => getRegisteredCoreNode(definition.type) ?? definition);
}
