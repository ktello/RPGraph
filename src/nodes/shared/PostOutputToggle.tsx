import { useNodeActions } from '../NodeActionsContext';

const postOutputTooltip =
  'After the RP output is shown in the chat UI, this node can run again to prepare the next turn, but only if the graph path reaches it.';

export function PostOutputToggle({
  id,
  enabled,
  className = '',
}: {
  id: string;
  enabled?: boolean;
  className?: string;
}) {
  const actions = useNodeActions();
  const rowClassName = ['post-output-toggle-row', className].filter(Boolean).join(' ');

  return (
    <div className={rowClassName}>
      <label className="node-toggle post-output-toggle nodrag">
        <input
          className="nodrag nowheel"
          type="checkbox"
          checked={enabled ?? false}
          onChange={(event) => actions.updateData(id, { runAfterRpOutput: event.target.checked })}
        />
        Prepare next turn when reached
      </label>
      <button
        className="node-info-button nodrag"
        type="button"
        aria-label={postOutputTooltip}
        data-tooltip={postOutputTooltip}
      >
        ?
      </button>
    </div>
  );
}
