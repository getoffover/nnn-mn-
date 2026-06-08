```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLoggingStore } from '../../../application/state/stores/uiStore';
import { Logger } from '../../../domain/shared/Logger';
import { Result } from '../../../domain/shared/Result';
import { useTheme } from '../../../presentation/styles/semanticTokens';
import { Button } from '../shared/FallbackUI';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  context?: string;
}

const LogViewer: React.FC = () => {
  const { logs, clearLogs } = useLoggingStore();
  const [filter, setFilter] = useState<string>('ALL');
  const [maxLines, setMaxLines] = useState<number>(100);
  const [showTimestamps, setShowTimestamps] = useState<boolean>(true);
  const [showContext, setShowContext] = useState<boolean>(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

  const filteredLogs: LogEntry[] = logs
    .filter((log) => {
      if (filter === 'ALL') return true;
      return log.level === filter;
    })
    .slice(-maxLines);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs]);

  const formatTimestamp = (date: Date): string => {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'ERROR':
        return theme.colors.red[500];
      case 'WARN':
        return theme.colors.amber[500];
      case 'DEBUG':
        return theme.colors.blue[400];
      default:
        return theme.colors.green[500];
    }
  };

  const getLevelBg = (level: string): string => {
    switch (level) {
      case 'ERROR':
        return theme.colors.red[900];
      case 'WARN':
        return theme.colors.amber[900];
      case 'DEBUG':
        return theme.colors.blue[900];
      default:
        return theme.colors.green[900];
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden rounded-lg border border-gray-700 bg-gray-900/80 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-700 p-3">
        <h3 className="text-lg font-semibold text-gray-100">Log Viewer</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md bg-gray-800 px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Levels</option>
            <option value="ERROR">Errors</option>
            <option value="WARN">Warnings</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>

          <input
            type="number"
            min="10"
            max="1000"
            step="10"
            value={maxLines}
            onChange={(e) => setMaxLines(Math.min(1000, Math.max(10, Number(e.target.value))))}
            className="w-20 rounded-md bg-gray-800 px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Button
            onClick={() => setShowTimestamps(!showTimestamps)}
            variant="secondary"
            className="px-2 py-1 text-xs"
          >
            {showTimestamps ? 'Hide Time' : 'Show Time'}
          </Button>

          <Button
            onClick={() => setShowContext(!showContext)}
            variant="secondary"
            className="px-2 py-1 text-xs"
          >
            {showContext ? 'Hide Context' : 'Show Context'}
          </Button>

          <Button
            onClick={clearLogs}
            variant="danger"
            className="px-2 py-1 text-xs"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-y-auto bg-gray-950 p-2 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            No logs to display
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className="mb-1 flex items-start gap-2 rounded px-1 hover:bg-gray-800/50"
            >
              {showTimestamps && (
                <span className="text-gray-500 min-w-[120px]">
                  {formatTimestamp(new Date(log.timestamp))}
                </span>
              )}
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white`}
                style={{
                  backgroundColor: getLevelBg(log.level),
                  color: '#fff',
                }}
              >
                {log.level}
              </span>
              <span className="flex-1 break-all text-gray-300">
                {log.message}
              </span>
              {showContext && log.context && (
                <span className="text-gray-600">
                  [{log.context}]
                </span>
              )}
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default LogViewer;
```