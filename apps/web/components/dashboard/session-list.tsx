'use client';

import { cn, formatDuration, formatRelativeTime, formatTokens, formatCurrency } from '@/lib/utils';
import type { Session } from '@/lib/api';
import { Activity, CheckCircle2, XCircle, Clock, GitBranch, FolderOpen, History } from 'lucide-react';

interface SessionListProps {
  sessions: Session[];
  onSelectSession?: (session: Session) => void;
  selectedSessionId?: string;
}

const statusIcons = {
  active: Activity,
  completed: CheckCircle2,
  failed: XCircle,
};

const statusColors = {
  active: 'text-neon-blue',
  completed: 'text-green-400',
  failed: 'text-red-400',
};

const statusGlow = {
  active: 'bg-neon-blue/20',
  completed: 'bg-green-400/20',
  failed: 'bg-red-400/20',
};

const modelStyles = {
  opus: {
    bg: 'bg-neon-purple/20',
    text: 'text-neon-purple',
    border: 'border-neon-purple/30',
  },
  sonnet: {
    bg: 'bg-neon-blue/20',
    text: 'text-neon-blue',
    border: 'border-neon-blue/30',
  },
  haiku: {
    bg: 'bg-green-400/20',
    text: 'text-green-400',
    border: 'border-green-400/30',
  },
};

export function SessionList({ sessions, onSelectSession, selectedSessionId }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="glass-card-hover rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-lg text-white tracking-wide">
              RECENT SESSIONS
            </h3>
            <p className="text-xs font-mono text-gray-500 uppercase mt-1">
              Activity Log
            </p>
          </div>
          <History className="h-5 w-5 text-neon-blue" />
        </div>
        <p className="text-sm text-gray-500 text-center py-8 font-mono">
          NO SESSIONS RECORDED YET
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-hover rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-lg text-white tracking-wide">
            RECENT SESSIONS
          </h3>
          <p className="text-xs font-mono text-gray-500 uppercase mt-1">
            Activity Log
          </p>
        </div>
        <History className="h-5 w-5 text-neon-blue" />
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {sessions.map((session) => {
          const StatusIcon = statusIcons[session.status];
          const modelStyle = modelStyles[session.model as keyof typeof modelStyles] || modelStyles.sonnet;

          return (
            <div
              key={session.id}
              className={cn(
                'p-4 rounded-xl cursor-pointer transition-all duration-300',
                'bg-black/20 border border-white/5',
                'hover:border-neon-pink/30 hover:bg-black/30',
                selectedSessionId === session.id && 'border-neon-pink/50 bg-black/40'
              )}
              onClick={() => onSelectSession?.(session)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center',
                      statusGlow[session.status]
                    )}>
                      <StatusIcon className={cn('h-4 w-4', statusColors[session.status])} />
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-mono uppercase',
                        'border',
                        modelStyle.bg,
                        modelStyle.text,
                        modelStyle.border
                      )}
                    >
                      {session.model}
                    </span>
                    <span className="text-xs text-gray-500 font-mono" suppressHydrationWarning>
                      {formatRelativeTime(new Date(session.startTime))}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1 truncate">
                      <FolderOpen className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {session.workingDirectory.split('/').slice(-2).join('/')}
                      </span>
                    </span>
                    {session.gitBranch && (
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{session.gitBranch}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1 flex-shrink-0">
                  <div className="text-sm font-mono text-neon-pink text-glow">
                    {formatCurrency(session.totalCostUsd)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                    <span>{formatTokens(session.totalTokens)}</span>
                    {session.durationSeconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(session.durationSeconds)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
