'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Activity, CheckCircle2, Clock, Zap, Radio, Cpu, Coins, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LiveEvent {
  id: number;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
  timestamp: string;
}

const toolColors: Record<string, { color: string; bg: string }> = {
  Read: { color: 'text-neon-blue', bg: 'bg-neon-blue/20' },
  Write: { color: 'text-neon-pink', bg: 'bg-neon-pink/20' },
  Edit: { color: 'text-neon-purple', bg: 'bg-neon-purple/20' },
  Bash: { color: 'text-neon-orange', bg: 'bg-neon-orange/20' },
  Glob: { color: 'text-green-400', bg: 'bg-green-400/20' },
  Grep: { color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
  Task: { color: 'text-cyan-400', bg: 'bg-cyan-400/20' },
  default: { color: 'text-gray-400', bg: 'bg-gray-400/20' },
};

export function LiveFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/events?limit=50');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events || []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    // Auto-refresh every 3 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchEvents, 3000);
      return () => clearInterval(interval);
    }
  }, [fetchEvents, autoRefresh]);

  const getToolColor = (toolName?: string) => {
    if (!toolName) return toolColors.default;
    return toolColors[toolName] || toolColors.default;
  };

  return (
    <div className="glass-card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-5 w-5 text-neon-pink" />
            {autoRefresh && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-display text-lg text-white tracking-wide">
              LIVE ACTIVITY
            </h3>
            <p className="text-xs font-mono text-gray-500 uppercase mt-1">
              File-based Events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'text-xs font-mono',
              autoRefresh ? 'text-green-400' : 'text-gray-500'
            )}
          >
            {autoRefresh ? 'AUTO' : 'PAUSED'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchEvents}
            className="text-gray-400 hover:text-neon-pink"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2">
        {loading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-600 mb-4 animate-spin" />
            <p className="text-sm text-gray-500 font-mono uppercase">
              LOADING EVENTS...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Cpu className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-sm text-gray-500 font-mono uppercase">
              NO EVENTS YET
            </p>
            <p className="text-xs text-gray-600 mt-2 text-center max-w-xs">
              Run Claude Code with the hook enabled to capture events.
              Check Settings for setup instructions.
            </p>
          </div>
        ) : (
          events.map((event) => {
            const colors = getToolColor(event.tool_name);

            return (
              <div
                key={event.id}
                className={cn(
                  'p-3 rounded-xl transition-all duration-300',
                  'bg-black/20 border border-white/5',
                  'hover:border-white/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    colors.bg
                  )}>
                    <Activity className={cn('h-4 w-4', colors.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-sm font-mono', colors.color)}>
                      {event.tool_name || 'UNKNOWN'}
                    </span>
                    {event.tool_input && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {JSON.stringify(event.tool_input).slice(0, 80)}
                        {JSON.stringify(event.tool_input).length > 80 && '...'}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-mono flex-shrink-0" suppressHydrationWarning>
                    {formatRelativeTime(new Date(event.timestamp))}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {lastUpdated && (
        <div className="mt-4 text-xs text-gray-600 font-mono text-center" suppressHydrationWarning>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
