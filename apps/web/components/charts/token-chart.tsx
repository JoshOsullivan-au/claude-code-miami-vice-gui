'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatTokens } from '@/lib/utils';

interface TokenChartProps {
  data: Array<{
    date: string;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
  }>;
}

export function TokenChart({ data }: TokenChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="inputGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outputGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="thinkingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs fill-muted-foreground"
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis
          className="text-xs fill-muted-foreground"
          tickFormatter={formatTokens}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value: number, name: string) => [formatTokens(value), name]}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="inputTokens"
          name="Input"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#inputGradient)"
        />
        <Area
          type="monotone"
          dataKey="outputTokens"
          name="Output"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#outputGradient)"
        />
        <Area
          type="monotone"
          dataKey="thinkingTokens"
          name="Thinking"
          stroke="#8b5cf6"
          fillOpacity={1}
          fill="url(#thinkingGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
