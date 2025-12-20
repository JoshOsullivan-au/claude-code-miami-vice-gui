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

export default function DashboardPage() {
  const { selectedPeriod, setSelectedPeriod } = useObservatoryStore();

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', selectedPeriod],
    queryFn: () => api.getAnalyticsSummary(selectedPeriod),
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions({ limit: 10 }),
  });

  const { data: dailyData } = useQuery({
    queryKey: ['daily-data'],
    queryFn: () => api.getDailyData(30),
  });

  const { data: costs } = useQuery({
    queryKey: ['costs', selectedPeriod],
    queryFn: () => api.getCosts(selectedPeriod),
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

        {/* Live Feed */}
        <LiveFeed />
      </div>
    </div>
  );
}
