'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/header';
import { StatCard } from '@/components/dashboard/stat-card';
import { CostChart } from '@/components/charts/cost-chart';
import { ModelPieChart } from '@/components/charts/model-pie-chart';
import { api } from '@/lib/api';
import { useObservatoryStore } from '@/lib/store';
import { formatCurrency, cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Calculator, PieChart } from 'lucide-react';

const periodOptions = [
  { value: '7d', label: '7 DAYS' },
  { value: '30d', label: '30 DAYS' },
  { value: 'all', label: 'ALL TIME' },
] as const;

export default function CostsPage() {
  const { selectedPeriod, setSelectedPeriod } = useObservatoryStore();

  const { data: costs } = useQuery({
    queryKey: ['costs', selectedPeriod],
    queryFn: () => api.getCosts(selectedPeriod),
  });

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', selectedPeriod],
    queryFn: () => api.getAnalyticsSummary(selectedPeriod),
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Token Costs" />

      <div className="flex-1 overflow-auto p-6 space-y-8 custom-scrollbar">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-neon-pink" />
            <span className="text-sm font-mono text-gray-400 uppercase tracking-widest">
              Cost Analysis
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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Spent"
            value={formatCurrency(summary?.tokens.totalCost || 0)}
            icon={DollarSign}
            color="pink"
          />
          <StatCard
            title="Average Per Session"
            value={formatCurrency(
              summary?.sessions.totalSessions
                ? (summary?.tokens.totalCost || 0) / summary.sessions.totalSessions
                : 0
            )}
            icon={Calculator}
            color="blue"
          />
          <StatCard
            title="Input vs Output Ratio"
            value={`${Math.round(
              ((summary?.tokens.totalInputTokens || 0) /
                ((summary?.tokens.totalInputTokens || 0) + (summary?.tokens.totalOutputTokens || 1))) *
                100
            )}% in`}
            icon={PieChart}
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card-hover rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg text-white tracking-wide">
                  DAILY COSTS
                </h3>
                <p className="text-xs font-mono text-gray-500 uppercase mt-1">
                  USD Trend
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-neon-orange" />
            </div>
            {costs?.byDay && costs.byDay.length > 0 ? (
              <CostChart data={costs.byDay} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500 font-mono text-sm">
                NO DATA AVAILABLE
              </div>
            )}
          </div>

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
        </div>

        {/* Model Breakdown Table */}
        {costs?.byModel && costs.byModel.length > 0 && (
          <div className="glass-card-hover rounded-2xl p-6">
            <h3 className="font-display text-lg text-white tracking-wide mb-6">
              MODEL BREAKDOWN
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-mono text-gray-500 uppercase border-b border-white/10">
                    <th className="pb-3">Model</th>
                    <th className="pb-3">Total Cost</th>
                    <th className="pb-3">Sessions</th>
                    <th className="pb-3">Avg/Session</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {costs.byModel.map((model) => (
                    <tr key={model.model} className="border-b border-white/5">
                      <td className="py-3">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-mono uppercase',
                          model.model === 'opus' && 'bg-neon-purple/20 text-neon-purple',
                          model.model === 'sonnet' && 'bg-neon-blue/20 text-neon-blue',
                          model.model === 'haiku' && 'bg-green-400/20 text-green-400'
                        )}>
                          {model.model}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-neon-pink">
                        {formatCurrency(model.totalCost)}
                      </td>
                      <td className="py-3 font-mono text-gray-400">
                        {model.sessions}
                      </td>
                      <td className="py-3 font-mono text-gray-400">
                        {formatCurrency(model.sessions > 0 ? model.totalCost / model.sessions : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
