import { coreNodeDefinitions } from './coreDefinitions';
import { isNamespacedPluginTypeId } from './extensions/typeIdPolicy';
import { isNodeVersion } from './nodeVersion';
import type {
  CoreNodeCreationDefinition,
  CoreNodeType,
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
// the folder definitions before they finish evaluating.
export function registerCoreNodes() {
  if (coreNodesRegistered) {
    return;
  }
  coreNodesRegistered = true;
  coreNodeDefinitions().forEach(registerNode);
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

export function isRegisteredCoreNodeType(value: string): value is CoreNodeType {
  return coreNodeDefinitions().some((definition) => definition.type === value);
}
