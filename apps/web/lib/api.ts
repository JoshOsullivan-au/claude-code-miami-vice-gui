const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  model: string;
  workingDirectory: string;
  gitBranch?: string;
  totalTokens: number;
  totalCostUsd: number;
  status: 'active' | 'completed' | 'failed';
}

export interface Execution {
  id: string;
  sessionId: string;
  timestamp: string;
  toolName: string;
  parameters?: Record<string, unknown>;
  durationMs?: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

export interface AnalyticsSummary {
  period: string;
  sessions: {
    totalSessions: number;
    completedSessions: number;
    activeSessions: number;
    totalDurationSeconds: number;
  };
  tokens: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalThinkingTokens: number;
    totalCost: number;
  };
  topTools: Array<{
    toolName: string;
    count: number;
    avgDurationMs: number;
    successRate: number;
  }>;
  modelBreakdown: Array<{
    model: string;
    totalTokens: number;
    totalCost: number;
  }>;
}

export interface DailyData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  totalCost: number;
  sessionCount: number;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Sessions
  getSessions: (params?: { limit?: number; offset?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.status) searchParams.set('status', params.status);
    return fetchApi<{ sessions: Session[]; total: number }>(`/api/sessions?${searchParams}`);
  },

  getSession: (id: string) =>
    fetchApi<Session & { executions: Execution[] }>(`/api/sessions/${id}`),

  createSession: (data: { model: string; workingDirectory: string; gitBranch?: string }) =>
    fetchApi<{ id: string }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSession: (id: string, data: { status?: string; endTime?: string }) =>
    fetchApi(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Executions
  getExecutions: (params?: { sessionId?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.sessionId) searchParams.set('sessionId', params.sessionId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    return fetchApi<{ executions: Execution[] }>(`/api/executions?${searchParams}`);
  },

  // Analytics
  getAnalyticsSummary: (period?: '7d' | '30d' | 'all') =>
    fetchApi<AnalyticsSummary>(`/api/analytics/summary?period=${period || '7d'}`),

  getDailyData: (days?: number) =>
    fetchApi<{ days: number; data: DailyData[] }>(`/api/analytics/daily?days=${days || 30}`),

  getCosts: (period?: '7d' | '30d' | 'all') =>
    fetchApi<{
      period: string;
      totalCost: number;
      byModel: Array<{ model: string; totalCost: number }>;
      byDay: Array<{ date: string; cost: number }>;
    }>(`/api/analytics/costs?period=${period || '30d'}`),

  getToolsAnalytics: (limit?: number) =>
    fetchApi<{ tools: Array<{
      toolName: string;
      totalCalls: number;
      successCount: number;
      errorCount: number;
      avgDurationMs: number;
      totalCost: number;
    }> }>(`/api/analytics/tools?limit=${limit || 20}`),
};
