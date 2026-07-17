import type { Dispatch, SetStateAction } from 'react';
import { getRegisteredCoreNodes } from '../nodes/registry';
import { groupedPaletteDefinitions } from '../nodes/paletteGroups';

type NodeManagerDialogProps = {
  disabledNodeTypes: string[];
  setDisabledNodeTypes: Dispatch<SetStateAction<string[]>>;
  onClose: () => void;
};

export function NodeManagerDialog({
  disabledNodeTypes,
  setDisabledNodeTypes,
  onClose,
}: NodeManagerDialogProps) {
  const disabled = new Set(disabledNodeTypes);
  const groups = groupedPaletteDefinitions(
    getRegisteredCoreNodes().map((definition) => ({
      type: definition.type,
      label: definition.label,
      paletteGroup: definition.paletteGroup,
      paletteOrder: definition.paletteOrder,
      disableable: definition.disableable !== false,
    })),
  );

  const setEnabled = (type: string, enabled: boolean) => {
    setDisabledNodeTypes((current) => {
      const next = new Set(current);
      if (enabled) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return Array.from(next);
    });
  };

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="node-manager-dialog"
        role="dialog"
        aria-label="Node Manager"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2>Node Manager</h2>
          <button type="button" className="node-manager-close nodrag" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="node-manager-note">
          Disabled types are hidden from the add-node menu. Instances already in an open workflow
          switch to a placeholder — and back — when the workflow is reloaded.
        </p>
        <div className="node-manager-groups">
          {groups.map((group) => (
            <section className="node-manager-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.items.map((item) => {
                const enabled = !disabled.has(item.type);
                return (
                  <label className="node-manager-row" key={item.type}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={!item.disableable}
                      onChange={(event) => setEnabled(item.type, event.target.checked)}
                    />
                    <span className="node-manager-label">{item.label}</span>
                    <span className="node-manager-type">{item.type}</span>
                    {!item.disableable ? <span className="node-manager-locked">always on</span> : null}
                  </label>
                );
              })}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
