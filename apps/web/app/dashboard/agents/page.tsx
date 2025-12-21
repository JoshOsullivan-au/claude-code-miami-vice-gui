'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/dashboard/header';
import {
  Bot,
  Cpu,
  RefreshCw,
  Clock,
  MessageSquare,
  Terminal,
  Telescope,
  FileSearch,
  PenTool,
  HelpCircle,
  Activity,
  Users,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentInfo {
  agentId: string;
  sessionId: string;
  name: string;
  model: string;
  status: 'active' | 'completed' | 'unknown';
  messageCount: number;
  toolCalls: number;
  startTime: string;
  lastActivity: string;
  projectPath: string;
  filePath: string;
  firstMessage?: string;
  type: 'explore' | 'plan' | 'code-review' | 'general' | 'unknown';
}

interface AgentStats {
  total: number;
  active: number;
  completed: number;
  byModel: Record<string, number>;
  byType: Record<string, number>;
}

interface AgentsResponse {
  agents: AgentInfo[];
  count: number;
}

interface StatsResponse extends AgentStats {}

const typeIcons: Record<string, typeof Bot> = {
  explore: Telescope,
  plan: FileSearch,
  'code-review': PenTool,
  general: Bot,
  unknown: HelpCircle,
};

const typeColors: Record<string, { text: string; bg: string; border: string }> = {
  explore: { text: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
  plan: { text: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/30' },
  'code-review': { text: 'text-neon-orange', bg: 'bg-neon-orange/10', border: 'border-neon-orange/30' },
  general: { text: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30' },
  unknown: { text: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
};

const modelColors: Record<string, string> = {
  opus: 'text-neon-pink',
  sonnet: 'text-neon-purple',
  haiku: 'text-green-400',
  unknown: 'text-gray-400',
};

function formatTime(timestamp: string): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(timestamp: string): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
  });
}

function AgentCard({ agent }: { agent: AgentInfo }) {
  const colors = typeColors[agent.type] || typeColors.unknown;
  const Icon = typeIcons[agent.type] || Bot;
  const modelColor = modelColors[agent.model] || modelColors.unknown;

  return (
    <div className={cn('glass-card rounded-xl p-4 border', colors.border)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              {agent.name}
            </span>
            <span className={cn('text-[10px] font-mono uppercase px-1.5 py-0.5 rounded', colors.bg, colors.text)}>
              {agent.type}
            </span>
            <span className={cn('text-xs font-mono', modelColor)}>
              {agent.model}
            </span>
            {agent.status === 'active' && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                ACTIVE
              </span>
            )}
          </div>

          {agent.firstMessage && (
            <p className="text-xs text-gray-400 truncate mb-2">
              {agent.firstMessage}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {agent.messageCount} msgs
            </span>
            <span className="flex items-center gap-1">
              <Terminal className="h-3 w-3" />
              {agent.toolCalls} tools
            </span>
            <span className="flex items-center gap-1" suppressHydrationWarning>
              <Clock className="h-3 w-3" />
              {formatTime(agent.lastActivity)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-600 font-mono" suppressHydrationWarning>
            {formatDate(agent.startTime)}
          </p>
          <p className="text-[10px] text-gray-700 font-mono truncate max-w-[120px]">
            {agent.agentId.slice(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Bot; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', `bg-${color}/20`)}>
          <Icon className={cn('h-5 w-5', `text-${color}`)} />
        </div>
        <div>
          <p className="text-2xl font-display text-white">{value}</p>
          <p className="text-xs font-mono text-gray-500 uppercase">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, statsRes] = await Promise.all([
        fetch('http://localhost:3001/api/agents?minutes=240'),
        fetch('http://localhost:3001/api/agents/stats'),
      ]);

      if (!agentsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch agent data');
      }

      const agentsData: AgentsResponse = await agentsRes.json();
      const statsData: StatsResponse = await statsRes.json();

      setAgents(agentsData.agents);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  const activeAgents = agents.filter(a => a.status === 'active');
  const completedAgents = agents.filter(a => a.status === 'completed');

  return (
    <div className="flex flex-col h-full">
      <Header title="Agents" />
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-neon-purple" />
              </div>
              <div>
                <p className="text-2xl font-display text-white">{stats?.total || 0}</p>
                <p className="text-xs font-mono text-gray-500 uppercase">Total Agents</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-400/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-display text-white">{stats?.active || 0}</p>
                <p className="text-xs font-mono text-gray-500 uppercase">Active</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-400/20 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-display text-white">{stats?.completed || 0}</p>
                <p className="text-xs font-mono text-gray-500 uppercase">Completed</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-blue/20 flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-neon-blue" />
              </div>
              <div>
                <p className="text-2xl font-display text-white">
                  {Object.keys(stats?.byType || {}).length}
                </p>
                <p className="text-xs font-mono text-gray-500 uppercase">Agent Types</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-lg text-white tracking-wide">
              RECENT AGENTS
            </h2>
            <span className="text-xs font-mono text-gray-500">
              Last 4 hours
            </span>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={fetchData}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4 text-gray-400', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Type Distribution */}
        {stats && Object.keys(stats.byType).length > 0 && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-3">By Type</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => {
                const colors = typeColors[type] || typeColors.unknown;
                const Icon = typeIcons[type] || Bot;
                return (
                  <div
                    key={type}
                    className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg', colors.bg, 'border', colors.border)}
                  >
                    <Icon className={cn('h-3 w-3', colors.text)} />
                    <span className={cn('text-xs font-mono', colors.text)}>{type}</span>
                    <span className="text-xs font-mono text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Model Distribution */}
        {stats && Object.keys(stats.byModel).length > 0 && (
          <div className="glass-card rounded-xl p-4 mb-6">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-3">By Model</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byModel).map(([model, count]) => {
                const color = modelColors[model] || modelColors.unknown;
                return (
                  <div
                    key={model}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                  >
                    <span className={cn('text-xs font-mono uppercase', color)}>{model}</span>
                    <span className="text-xs font-mono text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Agents */}
        {activeAgents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Active Agents ({activeAgents.length})
            </h3>
            <div className="space-y-3">
              {activeAgents.map((agent) => (
                <AgentCard key={agent.agentId} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Agents */}
        {completedAgents.length > 0 && (
          <div>
            <h3 className="text-xs font-mono text-gray-500 uppercase mb-3">
              Completed Agents ({completedAgents.length})
            </h3>
            <div className="space-y-3">
              {completedAgents.map((agent) => (
                <AgentCard key={agent.agentId} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {loading && agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Cpu className="h-12 w-12 text-gray-600 mb-4 animate-pulse" />
            <p className="text-sm text-gray-500 font-mono uppercase">
              LOADING AGENTS...
            </p>
          </div>
        ) : !loading && agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-gray-600 mb-4" />
            <p className="text-sm text-gray-500 font-mono uppercase">
              NO RECENT AGENTS
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Spawn agents using the Task tool to see them here
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
