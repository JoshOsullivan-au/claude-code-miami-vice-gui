// Shared types for Claude Code Observatory

export interface Session {
  id: string;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  model: 'opus' | 'sonnet' | 'haiku';
  workingDirectory: string;
  gitBranch?: string;
  totalTokens: number;
  totalCostUsd: number;
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
}

export interface Execution {
  id: string;
  sessionId: string;
  timestamp: Date;
  toolName: string;
  parameters?: Record<string, unknown>;
  durationMs?: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

export interface TokenUsage {
  id: string;
  sessionId: string;
  executionId?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  costUsd: number;
  timestamp: Date;
}

// Model pricing (per 1M tokens) as of January 2025
export const MODEL_PRICING = {
  opus: { input: 15, output: 75, thinking: 75 },
  sonnet: { input: 3, output: 15, thinking: 15 },
  haiku: { input: 0.25, output: 1.25 },
} as const;

export function calculateCost(
  model: keyof typeof MODEL_PRICING,
  inputTokens: number,
  outputTokens: number,
  thinkingTokens: number = 0
): number {
  const prices = MODEL_PRICING[model];

  const inputCost = (inputTokens / 1_000_000) * prices.input;
  const outputCost = (outputTokens / 1_000_000) * prices.output;
  const thinkingCost = (thinkingTokens / 1_000_000) * ('thinking' in prices ? prices.thinking : prices.output);

  return inputCost + outputCost + thinkingCost;
}

// WebSocket message types
export type WebSocketMessageType =
  | 'connected'
  | 'session_started'
  | 'session_ended'
  | 'execution_started'
  | 'execution_completed'
  | 'token_usage';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data?: Record<string, unknown>;
  timestamp: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
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
