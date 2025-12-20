import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Sessions table - tracks individual Claude Code sessions
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  durationSeconds: integer('duration_seconds'),
  model: text('model').notNull(), // opus, sonnet, haiku
  workingDirectory: text('working_directory').notNull(),
  gitBranch: text('git_branch'),
  totalTokens: integer('total_tokens').default(0),
  totalCostUsd: real('total_cost_usd').default(0),
  status: text('status', { enum: ['active', 'completed', 'failed'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Executions table - tracks individual tool calls within sessions
export const executions = sqliteTable('executions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  toolName: text('tool_name').notNull(),
  parameters: text('parameters', { mode: 'json' }).$type<Record<string, unknown>>(),
  durationMs: integer('duration_ms'),
  inputTokens: integer('input_tokens').default(0),
  outputTokens: integer('output_tokens').default(0),
  costUsd: real('cost_usd').default(0),
  status: text('status', { enum: ['success', 'error', 'pending'] }).notNull().default('pending'),
  errorMessage: text('error_message'),
});

// Token usage table - detailed token tracking per request
export const tokenUsage = sqliteTable('token_usage', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  executionId: text('execution_id').references(() => executions.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  thinkingTokens: integer('thinking_tokens').default(0),
  cacheReadTokens: integer('cache_read_tokens').default(0),
  cacheWriteTokens: integer('cache_write_tokens').default(0),
  costUsd: real('cost_usd').default(0),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// Type exports for use in routes
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;
export type TokenUsage = typeof tokenUsage.$inferSelect;
export type NewTokenUsage = typeof tokenUsage.$inferInsert;
