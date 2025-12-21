'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/dashboard/header';
import {
  Brain,
  Terminal,
  FileText,
  MessageSquare,
  RefreshCw,
  Radio,
  Cpu,
  Clock,
  Zap,
  Eye,
  Edit3,
  FolderOpen,
  Search,
  Play,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParsedEvent {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'user_message';
  timestamp: string;
  sessionId: string;
  model?: string;
  isAgent?: boolean;
  agentId?: string;
  thinking?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
  filePath?: string;
  text?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheRead?: number;
  cacheWrite?: number;
}

interface ActiveSession {
  sessionId: string;
  filePath: string;
  lastModified: string;
  projectPath: string;
  eventCount: number;
  model?: string;
  isAgent: boolean;
}

interface LiveResponse {
  session: ActiveSession | null;
  events: ParsedEvent[];
}

const toolIcons: Record<string, typeof Terminal> = {
  Read: Eye,
  Write: Edit3,
  Edit: Edit3,
  Bash: Terminal,
  Glob: FolderOpen,
  Grep: Search,
  Task: Play,
  TodoWrite: CheckCircle2,
};

const toolColors: Record<string, { text: string; bg: string; border: string }> = {
  Read: { text: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
  Write: { text: 'text-neon-pink', bg: 'bg-neon-pink/10', border: 'border-neon-pink/30' },
  Edit: { text: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/30' },
  Bash: { text: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30' },
  Glob: { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
  Grep: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  Task: { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30' },
  TodoWrite: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  default: { text: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30' },
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function EventCard({ event, expanded, onToggle }: { event: ParsedEvent; expanded: boolean; onToggle: () => void }) {
  const colors = toolColors[event.toolName || ''] || toolColors.default;
  const Icon = toolIcons[event.toolName || ''] || Terminal;

  if (event.type === 'thinking') {
    return (
      <div className="glass-card rounded-xl p-4 border border-neon-purple/20">
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={onToggle}
        >
          <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
            <Brain className="h-4 w-4 text-neon-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-neon-purple">THINKING</span>
              <span className="text-xs text-gray-600" suppressHydrationWarning>{formatTime(event.timestamp)}</span>
              {expanded ? <ChevronDown className="h-3 w-3 text-gray-500" /> : <ChevronRight className="h-3 w-3 text-gray-500" />}
            </div>
            {expanded && event.thinking && (
              <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap font-mono bg-black/30 rounded-lg p-3 max-h-60 overflow-auto custom-scrollbar">
                {event.thinking}
              </pre>
            )}
            {!expanded && event.thinking && (
              <p className="mt-1 text-xs text-gray-500 truncate">
                {event.thinking.slice(0, 100)}...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (event.type === 'tool_call') {
    return (
      <div className={cn('glass-card rounded-xl p-4 border', colors.border)}>
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={onToggle}
        >
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
            <Icon className={cn('h-4 w-4', colors.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-mono', colors.text)}>{event.toolName}</span>
              <span className="text-xs text-gray-600" suppressHydrationWarning>{formatTime(event.timestamp)}</span>
              {expanded ? <ChevronDown className="h-3 w-3 text-gray-500" /> : <ChevronRight className="h-3 w-3 text-gray-500" />}
            </div>
            {event.toolInput && (
              <div className="mt-1">
                {event.toolInput.file_path && (
                  <p className="text-xs text-gray-400 truncate font-mono">
                    {String(event.toolInput.file_path)}
                  </p>
                )}
                {event.toolInput.command && (
                  <p className="text-xs text-gray-400 truncate font-mono">
                    $ {String(event.toolInput.command).slice(0, 80)}
                  </p>
                )}
                {event.toolInput.pattern && (
                  <p className="text-xs text-gray-400 truncate font-mono">
                    {String(event.toolInput.pattern)}
                  </p>
                )}
                {expanded && (
                  <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap font-mono bg-black/30 rounded-lg p-2 max-h-40 overflow-auto custom-scrollbar">
                    {JSON.stringify(event.toolInput, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (event.type === 'tool_result') {
    return (
      <div className="glass-card rounded-xl p-4 border border-gray-700/30 ml-8">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span className="text-xs font-mono text-gray-500">RESULT</span>
          {event.filePath && (
            <span className="text-xs text-gray-600 truncate">{event.filePath}</span>
          )}
        </div>
        {event.toolResult && expanded && (
          <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono bg-black/30 rounded-lg p-2 max-h-32 overflow-auto custom-scrollbar">
            {event.toolResult}
          </pre>
        )}
      </div>
    );
  }

  if (event.type === 'response') {
    return (
      <div className="glass-card rounded-xl p-4 border border-neon-blue/20">
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={onToggle}
        >
          <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-neon-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono text-neon-blue">RESPONSE</span>
              <span className="text-xs text-gray-600" suppressHydrationWarning>{formatTime(event.timestamp)}</span>
              {(event.inputTokens || event.outputTokens) && (
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {event.inputTokens || 0}in / {event.outputTokens || 0}out
                </span>
              )}
            </div>
            {event.text && (
              <div className={cn('mt-2 text-sm text-gray-300', !expanded && 'line-clamp-3')}>
                {event.text}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function LivePage() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/live/current?limit=50');
      if (!res.ok) throw new Error('Failed to fetch live data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    if (autoRefresh) {
      const interval = setInterval(fetchLive, 2000);
      return () => clearInterval(interval);
    }
  }, [fetchLive, autoRefresh]);

  const toggleEvent = (id: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const thinkingCount = data?.events.filter(e => e.type === 'thinking').length || 0;
  const toolCount = data?.events.filter(e => e.type === 'tool_call').length || 0;
  const responseCount = data?.events.filter(e => e.type === 'response').length || 0;

  return (
    <div className="flex flex-col h-full">
      <Header title="Live Session" />
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        {/* Session Info */}
        {data?.session && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Radio className="h-5 w-5 text-neon-pink" />
                  {autoRefresh && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-white tracking-wide">
                    LIVE SESSION
                  </h3>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">
                    {data.session.model || 'Unknown model'} • {data.session.eventCount} events
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-neon-purple flex items-center gap-1">
                    <Brain className="h-3 w-3" /> {thinkingCount}
                  </span>
                  <span className="text-neon-orange flex items-center gap-1">
                    <Terminal className="h-3 w-3" /> {toolCount}
                  </span>
                  <span className="text-neon-blue flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {responseCount}
                  </span>
                </div>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors',
                    autoRefresh
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  )}
                >
                  {autoRefresh ? 'LIVE' : 'PAUSED'}
                </button>
                <button
                  onClick={fetchLive}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className={cn('h-4 w-4 text-gray-400', loading && 'animate-spin')} />
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Events Timeline */}
        <div className="space-y-3">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Cpu className="h-12 w-12 text-gray-600 mb-4 animate-pulse" />
              <p className="text-sm text-gray-500 font-mono uppercase">
                LOADING SESSION...
              </p>
            </div>
          ) : data?.events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Radio className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-sm text-gray-500 font-mono uppercase">
                NO ACTIVE SESSION
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Start using Claude Code to see live events
              </p>
            </div>
          ) : (
            data?.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                expanded={expandedEvents.has(event.id)}
                onToggle={() => toggleEvent(event.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
