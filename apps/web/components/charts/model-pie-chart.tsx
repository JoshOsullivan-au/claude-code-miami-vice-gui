'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ModelPieChartProps {
  data: Array<{
    model: string;
    totalCost: number;
  }>;
}

const COLORS = {
  opus: '#8b5cf6',
  sonnet: '#3b82f6',
  haiku: '#10b981',
};

export function ModelPieChart({ data }: ModelPieChartProps) {
  const chartData = data.map((item) => ({
    name: item.model.charAt(0).toUpperCase() + item.model.slice(1),
    value: item.totalCost,
    fill: COLORS[item.model as keyof typeof COLORS] || '#6b7280',
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [formatCurrency(value), 'Cost']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
