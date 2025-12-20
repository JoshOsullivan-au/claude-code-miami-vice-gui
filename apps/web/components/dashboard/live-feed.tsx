'use client';

import { useEffect, useState } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Activity, CheckCircle2, Clock, Zap, Radio, Cpu, Coins, AlertCircle } from 'lucide-react';
import { useObservatoryStore } from '@/lib/store';

interface LiveEvent {
  id: string;
  type: 'session_started' | 'session_ended' | 'execution_started' | 'execution_completed' | 'token_usage';
  data: Record<string, unknown>;
  timestamp: string;
}

const eventConfig = {
  session_started: {
    icon: Zap,
    color: 'text-neon-blue',
    bg: 'bg-neon-blue/20',
    label: 'SESSION STARTED',
  },
  session_ended: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-400/20',
    label: 'SESSION ENDED',
  },
  execution_started: {
    icon: Clock,
    color: 'text-neon-orange',
    bg: 'bg-neon-orange/20',
    label: 'TOOL EXECUTING',
  },
  execution_completed: {
    icon: Activity,
    color: 'text-neon-purple',
    bg: 'bg-neon-purple/20',
    label: 'TOOL COMPLETED',
  },
  token_usage: {
    icon: Coins,
    color: 'text-neon-pink',
    bg: 'bg-neon-pink/20',
    label: 'TOKEN USAGE',
  },
};

export function LiveFeed() {
  const { wsConnected, setWsConnected } = useObservatoryStore();
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.onopen = () => {
      setWsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'connected' && data.type !== 'pong') {
          setEvents((prev) => [data, ...prev].slice(0, 50));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [setWsConnected]);

  return (
    <div className="glass-card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-5 w-5 text-neon-pink" />
            {wsConnected && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-display text-lg text-white tracking-wide">
              LIVE ACTIVITY
            </h3>
            <p className="text-xs font-mono text-gray-500 uppercase mt-1">
              Real-time Events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10">
          <div className={wsConnected ? 'status-dot-online' : 'status-dot-offline'} />
          <span className={cn(
            'text-xs font-mono uppercase',
            wsConnected ? 'text-green-400' : 'text-red-400'
          )}>
            {wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Cpu className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-sm text-gray-500 font-mono uppercase">
              WAITING FOR ACTIVITY...
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Events will appear here in real-time
            </p>
          </div>
        ) : (
          events.map((event, index) => {
            const config = eventConfig[event.type] || {
              icon: AlertCircle,
              color: 'text-gray-400',
              bg: 'bg-gray-400/20',
              label: event.type,
            };
            const Icon = config.icon;

            return (
              <div
                key={`${event.timestamp}-${index}`}
                className={cn(
                  'p-3 rounded-xl transition-all duration-300',
                  'bg-black/20 border border-white/5',
                  'hover:border-white/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    config.bg
                  )}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-sm font-mono', config.color)}>
                      {config.label}
                    </span>
                    {event.data && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {JSON.stringify(event.data).slice(0, 80)}
                        {JSON.stringify(event.data).length > 80 && '...'}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                    {formatRelativeTime(new Date(event.timestamp))}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
