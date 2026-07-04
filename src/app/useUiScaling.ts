import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  maxUiScale as maximumEffectiveUiScale,
  minUiScale as minimumAdditionalUiScale,
  validUiScale,
} from '../settings';

const minimumEffectiveUiScale = 1;

function measuredDisplayScale(uiScale: number) {
  const safeUiScale = validUiScale(uiScale);
  const devicePixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  return Math.max(1, devicePixelRatio / safeUiScale);
}

function maxAdditionalUiScale(displayScale: number) {
  return Math.min(
    maximumEffectiveUiScale,
    Math.max(minimumAdditionalUiScale, maximumEffectiveUiScale / Math.max(1, displayScale)),
  );
}

function minAdditionalUiScale(displayScale: number) {
  return Math.min(
    maximumEffectiveUiScale,
    Math.max(minimumAdditionalUiScale, minimumEffectiveUiScale / Math.max(1, displayScale)),
  );
}

function roundedScale(value: number) {
  return Math.round(value * 100) / 100;
}

export function useUiScaling(
  uiScale: number,
  setUiScale: Dispatch<SetStateAction<number>>,
) {
  const [detectedDisplayScale, setDetectedDisplayScale] = useState(() =>
    measuredDisplayScale(1),
  );
  const maxUiScale = maxAdditionalUiScale(detectedDisplayScale);
  const minUiScale = minAdditionalUiScale(detectedDisplayScale);
  const appliedUiScale = Math.min(Math.max(validUiScale(uiScale), minUiScale), maxUiScale);
  const effectiveUiScale = detectedDisplayScale * appliedUiScale;

  useEffect(() => {
    window.rpgraph.setZoomFactor(appliedUiScale);

    function updateDetectedDisplayScale() {
      setDetectedDisplayScale(measuredDisplayScale(appliedUiScale));
    }

    updateDetectedDisplayScale();
    window.addEventListener('resize', updateDetectedDisplayScale);
    const interval = window.setInterval(updateDetectedDisplayScale, 1200);
    return () => {
      window.removeEventListener('resize', updateDetectedDisplayScale);
      window.clearInterval(interval);
    };
  }, [appliedUiScale]);

  function changeUiScale(value: number) {
    setUiScale(Math.min(Math.max(validUiScale(value), minUiScale), maxUiScale));
  }

  function changeEffectiveUiScale(value: number) {
    const nextEffectiveUiScale = Math.min(
      maximumEffectiveUiScale,
      Math.max(minimumEffectiveUiScale, value),
    );
    changeUiScale(roundedScale(nextEffectiveUiScale / Math.max(1, detectedDisplayScale)));
  }

  return {
    appliedUiScale,
    detectedDisplayScale,
    effectiveUiScale,
    minUiScale,
    maxUiScale,
    changeUiScale,
    changeEffectiveUiScale,
  };
}
