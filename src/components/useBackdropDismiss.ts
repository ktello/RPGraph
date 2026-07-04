import { useRef, type MouseEvent, type PointerEvent } from 'react';

export function useBackdropDismiss<T extends HTMLElement>(onDismiss: () => void) {
  const pointerStartedOnBackdropRef = useRef(false);

  return {
    onPointerDown(event: PointerEvent<T>) {
      pointerStartedOnBackdropRef.current = event.target === event.currentTarget;
    },
    onClick(event: MouseEvent<T>) {
      const shouldDismiss = pointerStartedOnBackdropRef.current && event.target === event.currentTarget;
      pointerStartedOnBackdropRef.current = false;
      if (shouldDismiss) {
        onDismiss();
      }
    },
  };
}
