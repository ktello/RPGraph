import { createContext, useContext } from 'react';
import type { NodeActions } from './types';

export const NodeActionsContext = createContext<NodeActions | null>(null);

export function useNodeActions() {
  const actions = useContext(NodeActionsContext);
  if (!actions) {
    throw new Error('NodeActionsContext is not available.');
  }
  return actions;
}
