import type { MouseEvent } from 'react';
import type { ChatImageAttachment } from '../types';

type ImageContextControlProps = {
  image: ChatImageAttachment;
  inContext: boolean;
  manuallySelected: boolean;
  disabled?: boolean;
  contextEnabled?: boolean;
  contextDisabledReason?: string;
  onToggle: (image: ChatImageAttachment) => void;
};

export function ImageContextControl({
  image,
  inContext,
  manuallySelected,
  disabled = false,
  contextEnabled = true,
  contextDisabledReason = 'Not possible without vision capabilities.',
  onToggle,
}: ImageContextControlProps) {
  if (!image.id.trim()) {
    return null;
  }
  if (contextEnabled && inContext && !manuallySelected) {
    return <span className="image-context-badge">In context</span>;
  }

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!contextEnabled) {
      return;
    }
    onToggle(image);
  };

  const isDisabled = disabled || !contextEnabled;
  const ariaLabel = !contextEnabled
    ? `${image.name} cannot be added to next-turn context without vision capabilities`
    : inContext
      ? `Remove ${image.name} from next-turn context`
      : `Add ${image.name} to next-turn context`;
  const title = !contextEnabled
    ? contextDisabledReason
    : inContext
      ? 'Remove from next-turn context'
      : 'Add to next-turn context';

  return (
    <button
      className={`image-context-toggle${contextEnabled && inContext ? ' active' : ''}${contextEnabled ? '' : ' unavailable'}`}
      type="button"
      onClick={toggle}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={title}
    >
      {!contextEnabled ? 'No vision' : inContext ? 'In context' : '-'}
    </button>
  );
}
