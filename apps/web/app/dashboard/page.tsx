'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { SessionList } from '@/components/dashboard/session-list';
import { LiveFeed } from '@/components/dashboard/live-feed';
import { TokenChart } from '@/components/charts/token-chart';
import { CostChart } from '@/components/charts/cost-chart';
import { ModelPieChart } from '@/components/charts/model-pie-chart';
import { api } from '@/lib/api';
import { useObservatoryStore } from '@/lib/store';
import { formatCurrency, formatTokens, formatDuration, cn } from '@/lib/utils';
import { Activity, DollarSign, Coins, Clock, TrendingUp, Zap } from 'lucide-react';

const periodOptions = [
  { value: '7d', label: '7 DAYS' },
  { value: '30d', label: '30 DAYS' },
  { value: 'all', label: 'ALL TIME' },
] as const;

// Mock data for demo/screenshot mode - static dates to avoid hydration mismatch
const mockSummary = {
  sessions: { totalSessions: 12, activeSessions: 1, completedSessions: 11, totalDurationSeconds: 172800 },
  tokens: { totalInputTokens: 2450000, totalOutputTokens: 890000, totalCost: 127.45 },
};

const mockSessions = {
  sessions: [
    { id: '1', model: 'sonnet', workingDirectory: 'projects/web-app', gitBranch: 'feature/dashboard', startTime: '2025-12-21T10:00:00Z', totalTokens: 125000, totalCostUsd: 12.50, status: 'completed' },
    { id: '2', model: 'opus', workingDirectory: 'projects/api-server', gitBranch: 'main', startTime: '2025-12-20T10:00:00Z', totalTokens: 340000, totalCostUsd: 45.20, status: 'completed' },
    { id: '3', model: 'opus', workingDirectory: 'projects/mobile-app', gitBranch: 'develop', startTime: '2025-12-19T10:00:00Z', totalTokens: 280000, totalCostUsd: 38.90, status: 'completed' },
    { id: '4', model: 'haiku', workingDirectory: 'projects/scripts', gitBranch: 'main', startTime: '2025-12-18T10:00:00Z', totalTokens: 45000, totalCostUsd: 2.15, status: 'completed' },
  ],
};

const mockDailyData = {
  data: [
    { date: '2025-12-08', inputTokens: 320000, outputTokens: 95000, thinkingTokens: 25000 },
    { date: '2025-12-09', inputTokens: 280000, outputTokens: 110000, thinkingTokens: 30000 },
    { date: '2025-12-10', inputTokens: 410000, outputTokens: 140000, thinkingTokens: 45000 },
    { date: '2025-12-11', inputTokens: 195000, outputTokens: 78000, thinkingTokens: 18000 },
    { date: '2025-12-12', inputTokens: 350000, outputTokens: 125000, thinkingTokens: 35000 },
    { date: '2025-12-13', inputTokens: 480000, outputTokens: 165000, thinkingTokens: 42000 },
    { date: '2025-12-14', inputTokens: 220000, outputTokens: 88000, thinkingTokens: 22000 },
    { date: '2025-12-15', inputTokens: 390000, outputTokens: 132000, thinkingTokens: 38000 },
    { date: '2025-12-16', inputTokens: 275000, outputTokens: 98000, thinkingTokens: 28000 },
    { date: '2025-12-17', inputTokens: 445000, outputTokens: 155000, thinkingTokens: 48000 },
    { date: '2025-12-18', inputTokens: 310000, outputTokens: 105000, thinkingTokens: 32000 },
    { date: '2025-12-19', inputTokens: 365000, outputTokens: 118000, thinkingTokens: 36000 },
    { date: '2025-12-20', inputTokens: 420000, outputTokens: 145000, thinkingTokens: 40000 },
    { date: '2025-12-21', inputTokens: 255000, outputTokens: 92000, thinkingTokens: 24000 },
  ],
};

const mockCosts = {
  byDay: [
    { date: '2025-12-08', cost: 18.50 },
    { date: '2025-12-09', cost: 14.25 },
    { date: '2025-12-10', cost: 22.80 },
    { date: '2025-12-11', cost: 9.45 },
    { date: '2025-12-12', cost: 16.70 },
    { date: '2025-12-13', cost: 25.90 },
    { date: '2025-12-14', cost: 11.30 },
    { date: '2025-12-15', cost: 19.60 },
    { date: '2025-12-16', cost: 13.85 },
    { date: '2025-12-17', cost: 24.15 },
    { date: '2025-12-18', cost: 15.40 },
    { date: '2025-12-19', cost: 17.95 },
    { date: '2025-12-20', cost: 21.50 },
    { date: '2025-12-21', cost: 12.60 },
  ],
  byModel: [
    { model: 'opus', cost: 89.50, percentage: 70 },
    { model: 'sonnet', cost: 32.15, percentage: 25 },
    { model: 'haiku', cost: 5.80, percentage: 5 },
  ],
};

export default function DashboardPage() {
  const { selectedPeriod, setSelectedPeriod, demoMode } = useObservatoryStore();

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', selectedPeriod, demoMode],
    queryFn: () => demoMode ? Promise.resolve(mockSummary) : api.getAnalyticsSummary(selectedPeriod),
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions', demoMode],
    queryFn: () => demoMode ? Promise.resolve(mockSessions) : api.getSessions({ limit: 10 }),
  });

  const { data: dailyData } = useQuery({
    queryKey: ['daily-data', demoMode],
    queryFn: () => demoMode ? Promise.resolve(mockDailyData) : api.getDailyData(30),
  });

  const { data: costs } = useQuery({
    queryKey: ['costs', selectedPeriod, demoMode],
    queryFn: () => demoMode ? Promise.resolve(mockCosts) : api.getCosts(selectedPeriod),
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />

      <div className="flex-1 overflow-auto p-6 space-y-8 custom-scrollbar">
        {/* Period Selector - Retro Pills */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-neon-pink" />
            <span className="text-sm font-mono text-gray-400 uppercase tracking-widest">
              Analytics Overview
            </span>
          </div>
          <div className="flex items-center gap-2 p-1 rounded-full bg-black/30 border border-white/10">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPeriod(option.value as '7d' | '30d' | 'all')}
                className={cn(
                  'nav-pill',
                  selectedPeriod === option.value
                    ? 'nav-pill-active'
                    : 'nav-pill-inactive'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Sessions"
            value={summary?.sessions.totalSessions || 0}
            description={`${summary?.sessions.activeSessions || 0} active`}
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="Total Cost"
            value={formatCurrency(summary?.tokens.totalCost || 0)}
            description={`${selectedPeriod === '7d' ? 'Last 7 days' : selectedPeriod === '30d' ? 'Last 30 days' : 'All time'}`}
            icon={DollarSign}
            color="pink"
          />
          <StatCard
            title="Total Tokens"
            value={formatTokens((summary?.tokens.totalInputTokens || 0) + (summary?.tokens.totalOutputTokens || 0))}
            description={`${formatTokens(summary?.tokens.totalInputTokens || 0)} in / ${formatTokens(summary?.tokens.totalOutputTokens || 0)} out`}
            icon={Coins}
            color="purple"
          />
          <StatCard
            title="Total Duration"
            value={formatDuration(summary?.sessions.totalDurationSeconds || 0)}
            description={`${summary?.sessions.completedSessions || 0} completed`}
            icon={Clock}
            color="orange"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Token Usage Chart */}
          <div className="glass-card-hover rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg text-white tracking-wide">
                  TOKEN USAGE
                </h3>
                <p className="text-xs font-mono text-gray-500 uppercase mt-1">
                  Over Time
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neon-blue" />
                  <span className="text-xs text-gray-400">Input</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-neon-pink" />
                  <span className="text-xs text-gray-400">Output</span>
                </div>
              </div>
            </div>
            {dailyData?.data ? (
              <TokenChart data={dailyData.data} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-sm">
                NO DATA AVAILABLE
              </div>
            )}
          </div>

          {/* Daily Costs Chart */}
          <div className="glass-card-hover rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg text-white tracking-wide">
                  DAILY COSTS
                </h3>
                <p className="text-xs font-mono text-gray-500 uppercase mt-1">
                  USD Spent
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-neon-orange" />
            </div>
            {costs?.byDay ? (
              <CostChart data={costs.byDay} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-sm">
                NO DATA AVAILABLE
              </div>
            )}
          </div>
        </div>

        {/* Model Breakdown & Sessions Row */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Cost by Model */}
          <div className="glass-card-hover rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="font-display text-lg text-white tracking-wide">
                COST BY MODEL
              </h3>
              <p className="text-xs font-mono text-gray-500 uppercase mt-1">
                Distribution
              </p>
            </div>
            {costs?.byModel && costs.byModel.length > 0 ? (
              <ModelPieChart data={costs.byModel} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-sm">
                NO DATA AVAILABLE
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div className="md:col-span-2">
            <SessionList sessions={sessions?.sessions || []} />
          </div>
        </div>

        {/* Live Feed - hidden in demo mode */}
        {!demoMode && <LiveFeed />}
        {demoMode && (
          <div className="glass-card-hover rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="status-dot-online" />
              <h3 className="font-display text-lg text-white tracking-wide">LIVE ACTIVITY</h3>
              <span className="text-xs font-mono text-gray-500 uppercase ml-2">Demo Mode</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
                <div className="w-8 h-8 rounded-lg bg-neon-orange/20 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-neon-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neon-orange font-mono">Bash</p>
                  <p className="text-xs text-gray-500">npm run build</p>
                </div>
                <span className="text-xs text-gray-600">just now</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
                <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-neon-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neon-blue font-mono">Read</p>
                  <p className="text-xs text-gray-500">src/components/App.tsx</p>
                </div>
                <span className="text-xs text-gray-600">2m ago</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
