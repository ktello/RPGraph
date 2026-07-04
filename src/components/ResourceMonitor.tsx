import { useEffect, useMemo, useState } from 'react';

type ResourceStats = Awaited<ReturnType<Window['rpgraph']['getResourceStats']>>;

function roundedGb(bytes: number) {
  return bytes / (1024 ** 3);
}

function formatWholeGb(bytes: number) {
  return Math.round(roundedGb(bytes)).toLocaleString('en-US');
}

function formatTenthGb(bytes: number) {
  const value = Math.round(roundedGb(bytes) * 10) / 10;
  return Number.isInteger(value) ? value.toLocaleString('en-US') : value.toFixed(1);
}

export function ResourceMonitor() {
  const [stats, setStats] = useState<ResourceStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const nextStats = await window.rpgraph.getResourceStats();
        if (!cancelled) {
          setStats(nextStats);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
        }
      }
    }

    void refresh();
    const interval = window.setInterval(() => void refresh(), 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const lines = useMemo(() => {
    if (!stats) {
      return [];
    }

    const ram = `RAM: ${formatWholeGb(stats.ram.usedBytes)} / ${formatWholeGb(stats.ram.totalBytes)} GB${
      typeof stats.ram.cachedBytes === 'number'
        ? ` · cached ${formatWholeGb(stats.ram.cachedBytes)} GB`
        : ''
    }`;
    const vram = stats.vram
      ? `VRAM: ${formatTenthGb(stats.vram.usedBytes)} / ${formatWholeGb(stats.vram.totalBytes)} GB`
      : '';

    return vram ? [vram, ram] : [ram];
  }, [stats]);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="resource-monitor" aria-label="System resource usage">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );
}
