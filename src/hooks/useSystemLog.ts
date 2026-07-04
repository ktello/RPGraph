import { useEffect, useMemo, useRef, useState } from 'react';
import type { SystemLogEntry, SystemLogLevel } from '../types';
import { sanitizeDataUrlsInText } from '../utils/sanitize';

export function useSystemLog() {
  const [systemLog, setSystemLog] = useState<SystemLogEntry[]>([]);
  const [visibleLogEntry, setVisibleLogEntry] = useState<SystemLogEntry | null>(null);
  const [showSystemLog, setShowSystemLog] = useState(false);
  const nextLogId = useRef(1);

  useEffect(() => {
    if (!visibleLogEntry) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setVisibleLogEntry((current) => (current?.id === visibleLogEntry.id ? null : current));
    }, 4200);
    return () => window.clearTimeout(timeout);
  }, [visibleLogEntry]);

  const systemLogCounts = useMemo(
    () =>
      systemLog.reduce(
        (counts, entry) => ({ ...counts, [entry.level]: counts[entry.level] + 1 }),
        { info: 0, warning: 0, error: 0 } as Record<SystemLogLevel, number>,
      ),
    [systemLog],
  );
  const systemLogBadgeCount = systemLogCounts.error + systemLogCounts.warning;

  function notifySystem(level: SystemLogLevel, text: string) {
    const entry: SystemLogEntry = {
      id: nextLogId.current,
      level,
      text: sanitizeDataUrlsInText(text),
      createdAt: new Date().toISOString(),
    };
    nextLogId.current += 1;
    setSystemLog((current) => [...current, entry]);
    setVisibleLogEntry(entry);
    return entry.id;
  }

  function clearSystemLog() {
    setSystemLog([]);
    setVisibleLogEntry(null);
    nextLogId.current = 1;
  }

  function resetSystemLog() {
    clearSystemLog();
    setShowSystemLog(false);
  }

  function replaceSystemLog(entries: SystemLogEntry[]) {
    setSystemLog(entries.map((entry) => ({ ...entry, text: sanitizeDataUrlsInText(entry.text) })));
    setVisibleLogEntry(null);
    setShowSystemLog(false);
    nextLogId.current =
      entries.reduce((highest, entry) => Math.max(highest, entry.id), 0) + 1;
  }

  return {
    systemLog,
    systemLogCounts,
    systemLogBadgeCount,
    visibleLogEntry,
    showSystemLog,
    setShowSystemLog,
    notifySystem,
    clearSystemLog,
    resetSystemLog,
    replaceSystemLog,
  };
}
