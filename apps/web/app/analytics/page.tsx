'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TokenChart } from '@/components/charts/token-chart';
import { CostChart } from '@/components/charts/cost-chart';
import { ModelPieChart } from '@/components/charts/model-pie-chart';
import { api } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function AnalyticsPage() {
  const { data: tools } = useQuery({
    queryKey: ['tools-analytics'],
    queryFn: () => api.getToolsAnalytics(20),
  });

  const { data: costs } = useQuery({
    queryKey: ['costs', '30d'],
    queryFn: () => api.getCosts('30d'),
  });

  const { data: daily } = useQuery({
    queryKey: ['daily-data', 30],
    queryFn: () => api.getDailyData(30),
  });

  const maxCalls = Math.max(...(tools?.tools.map((t) => t.totalCalls) || [1]));

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Header title="Analytics" />

          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Token Usage (30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {daily?.data ? (
                    <TokenChart data={daily.data} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost by Model</CardTitle>
                </CardHeader>
                <CardContent>
                  {costs?.byModel && costs.byModel.length > 0 ? (
                    <ModelPieChart data={costs.byModel} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tool Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tool Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {tools?.tools && tools.tools.length > 0 ? (
                  <div className="space-y-4">
                    {tools.tools.map((tool) => (
                      <div key={tool.toolName} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{tool.toolName}</span>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>{formatNumber(tool.totalCalls)} calls</span>
                            <span>
                              {((tool.successCount / tool.totalCalls) * 100).toFixed(0)}% success
                            </span>
                            <span>{tool.avgDurationMs?.toFixed(0)}ms avg</span>
                            <span>{formatCurrency(tool.totalCost)}</span>
                          </div>
                        </div>
                        <Progress value={(tool.totalCalls / maxCalls) * 100} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No tool usage data available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Daily Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Daily Costs (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {costs?.byDay ? (
                  <CostChart data={costs.byDay} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
