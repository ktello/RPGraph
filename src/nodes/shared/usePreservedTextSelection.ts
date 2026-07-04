import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';

type EditableTextElement = HTMLInputElement | HTMLTextAreaElement;

type StoredSelection = {
  start: number;
  end: number;
  direction: 'forward' | 'backward' | 'none';
  scrollLeft: number;
  scrollTop: number;
};

export function usePreservedTextSelection<T extends EditableTextElement>(
  ref: RefObject<T | null>,
  value: string,
) {
  const selectionRef = useRef<StoredSelection | null>(null);

  const rememberSelection = useCallback((element: T) => {
    selectionRef.current = {
      start: element.selectionStart ?? element.value.length,
      end: element.selectionEnd ?? element.value.length,
      direction: element.selectionDirection ?? 'none',
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
    };
  }, []);

  useLayoutEffect(() => {
    const element = ref.current;
    const selection = selectionRef.current;
    if (!element || !selection || document.activeElement !== element) {
      return;
    }

    const start = Math.min(selection.start, value.length);
    const end = Math.min(selection.end, value.length);
    element.setSelectionRange(start, end, selection.direction);
    element.scrollLeft = selection.scrollLeft;
    element.scrollTop = selection.scrollTop;
  }, [ref, value]);

  return rememberSelection;
}
