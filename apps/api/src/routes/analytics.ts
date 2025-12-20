import { Hono } from 'hono';
import { sql, eq, gte, lte, and, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { sessions, executions, tokenUsage } from '../db/schema';

const app = new Hono();

// GET /analytics/summary - Get overall usage summary
app.get('/summary', async (c) => {
  const period = c.req.query('period') || '7d'; // 7d, 30d, all
  const now = new Date();

  let startDate: Date | undefined;
  if (period === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const conditions = startDate ? gte(sessions.startTime, startDate) : undefined;

  // Session stats
  const sessionStats = await db.select({
    totalSessions: sql<number>`count(*)`,
    completedSessions: sql<number>`sum(case when ${sessions.status} = 'completed' then 1 else 0 end)`,
    activeSessions: sql<number>`sum(case when ${sessions.status} = 'active' then 1 else 0 end)`,
    totalDurationSeconds: sql<number>`sum(${sessions.durationSeconds})`,
  })
    .from(sessions)
    .where(conditions);

  // Token stats
  const tokenStats = await db.select({
    totalInputTokens: sql<number>`sum(${tokenUsage.inputTokens})`,
    totalOutputTokens: sql<number>`sum(${tokenUsage.outputTokens})`,
    totalThinkingTokens: sql<number>`sum(${tokenUsage.thinkingTokens})`,
    totalCost: sql<number>`sum(${tokenUsage.costUsd})`,
  })
    .from(tokenUsage)
    .leftJoin(sessions, eq(tokenUsage.sessionId, sessions.id))
    .where(conditions);

  // Tool usage stats
  const toolStats = await db.select({
    toolName: executions.toolName,
    count: sql<number>`count(*)`,
    avgDurationMs: sql<number>`avg(${executions.durationMs})`,
    successRate: sql<number>`avg(case when ${executions.status} = 'success' then 1.0 else 0.0 end)`,
  })
    .from(executions)
    .leftJoin(sessions, eq(executions.sessionId, sessions.id))
    .where(conditions)
    .groupBy(executions.toolName)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Model usage breakdown
  const modelStats = await db.select({
    model: tokenUsage.model,
    totalTokens: sql<number>`sum(${tokenUsage.inputTokens} + ${tokenUsage.outputTokens})`,
    totalCost: sql<number>`sum(${tokenUsage.costUsd})`,
  })
    .from(tokenUsage)
    .leftJoin(sessions, eq(tokenUsage.sessionId, sessions.id))
    .where(conditions)
    .groupBy(tokenUsage.model);

  return c.json({
    period,
    sessions: sessionStats[0],
    tokens: tokenStats[0],
    topTools: toolStats,
    modelBreakdown: modelStats,
  });
});

// GET /analytics/daily - Get daily usage data for charts
app.get('/daily', async (c) => {
  const days = parseInt(c.req.query('days') || '30');
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const dailyStats = await db.select({
    date: sql<string>`date(${tokenUsage.timestamp}, 'unixepoch')`,
    inputTokens: sql<number>`sum(${tokenUsage.inputTokens})`,
    outputTokens: sql<number>`sum(${tokenUsage.outputTokens})`,
    thinkingTokens: sql<number>`sum(${tokenUsage.thinkingTokens})`,
    totalCost: sql<number>`sum(${tokenUsage.costUsd})`,
    sessionCount: sql<number>`count(distinct ${tokenUsage.sessionId})`,
  })
    .from(tokenUsage)
    .where(gte(tokenUsage.timestamp, startDate))
    .groupBy(sql`date(${tokenUsage.timestamp}, 'unixepoch')`)
    .orderBy(sql`date(${tokenUsage.timestamp}, 'unixepoch')`);

  return c.json({ days, data: dailyStats });
});

// GET /analytics/costs - Get cost breakdown
app.get('/costs', async (c) => {
  const period = c.req.query('period') || '30d';
  const now = new Date();

  let startDate: Date;
  if (period === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(0); // all time
  }

  // Cost by model
  const byModel = await db.select({
    model: tokenUsage.model,
    totalCost: sql<number>`sum(${tokenUsage.costUsd})`,
    inputCost: sql<number>`sum(${tokenUsage.inputTokens})`,
    outputCost: sql<number>`sum(${tokenUsage.outputTokens})`,
  })
    .from(tokenUsage)
    .where(gte(tokenUsage.timestamp, startDate))
    .groupBy(tokenUsage.model);

  // Cost by day
  const byDay = await db.select({
    date: sql<string>`date(${tokenUsage.timestamp}, 'unixepoch')`,
    cost: sql<number>`sum(${tokenUsage.costUsd})`,
  })
    .from(tokenUsage)
    .where(gte(tokenUsage.timestamp, startDate))
    .groupBy(sql`date(${tokenUsage.timestamp}, 'unixepoch')`)
    .orderBy(sql`date(${tokenUsage.timestamp}, 'unixepoch')`);

  // Total cost
  const total = await db.select({
    totalCost: sql<number>`sum(${tokenUsage.costUsd})`,
  })
    .from(tokenUsage)
    .where(gte(tokenUsage.timestamp, startDate));

  return c.json({
    period,
    totalCost: total[0]?.totalCost || 0,
    byModel,
    byDay,
  });
});

// GET /analytics/tools - Get tool usage analytics
app.get('/tools', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');

  const toolUsage = await db.select({
    toolName: executions.toolName,
    totalCalls: sql<number>`count(*)`,
    successCount: sql<number>`sum(case when ${executions.status} = 'success' then 1 else 0 end)`,
    errorCount: sql<number>`sum(case when ${executions.status} = 'error' then 1 else 0 end)`,
    avgDurationMs: sql<number>`avg(${executions.durationMs})`,
    minDurationMs: sql<number>`min(${executions.durationMs})`,
    maxDurationMs: sql<number>`max(${executions.durationMs})`,
    totalTokens: sql<number>`sum(${executions.inputTokens} + ${executions.outputTokens})`,
    totalCost: sql<number>`sum(${executions.costUsd})`,
  })
    .from(executions)
    .groupBy(executions.toolName)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  return c.json({ tools: toolUsage });
});

export default app;
