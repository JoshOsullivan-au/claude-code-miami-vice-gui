import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { sessions, executions, tokenUsage } from '../db/schema';

const app = new Hono();

// Schema for creating a new session
const createSessionSchema = z.object({
  model: z.enum(['opus', 'sonnet', 'haiku']),
  workingDirectory: z.string(),
  gitBranch: z.string().optional(),
});

// Schema for updating a session
const updateSessionSchema = z.object({
  status: z.enum(['active', 'completed', 'failed']).optional(),
  endTime: z.string().datetime().optional(),
});

// GET /sessions - List all sessions with pagination
app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const status = c.req.query('status') as 'active' | 'completed' | 'failed' | undefined;

  const conditions = status ? eq(sessions.status, status) : undefined;

  const result = await db.select()
    .from(sessions)
    .where(conditions)
    .orderBy(desc(sessions.startTime))
    .limit(limit)
    .offset(offset);

  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(conditions);

  return c.json({
    sessions: result,
    total: countResult[0].count,
    limit,
    offset,
  });
});

// GET /sessions/:id - Get a specific session with its executions
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const session = await db.select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  if (!session.length) {
    return c.json({ error: 'Session not found' }, 404);
  }

  const sessionExecutions = await db.select()
    .from(executions)
    .where(eq(executions.sessionId, id))
    .orderBy(desc(executions.timestamp));

  const sessionTokenUsage = await db.select()
    .from(tokenUsage)
    .where(eq(tokenUsage.sessionId, id))
    .orderBy(desc(tokenUsage.timestamp));

  return c.json({
    ...session[0],
    executions: sessionExecutions,
    tokenUsage: sessionTokenUsage,
  });
});

// POST /sessions - Create a new session
app.post('/', zValidator('json', createSessionSchema), async (c) => {
  const data = c.req.valid('json');
  const id = nanoid();
  const now = new Date();

  await db.insert(sessions).values({
    id,
    model: data.model,
    workingDirectory: data.workingDirectory,
    gitBranch: data.gitBranch,
    startTime: now,
    status: 'active',
    createdAt: now,
  });

  return c.json({ id, message: 'Session created' }, 201);
});

// PATCH /sessions/:id - Update a session
app.patch('/:id', zValidator('json', updateSessionSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const session = await db.select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  if (!session.length) {
    return c.json({ error: 'Session not found' }, 404);
  }

  const updateData: Partial<typeof sessions.$inferInsert> = {};

  if (data.status) {
    updateData.status = data.status;
  }

  if (data.endTime) {
    const endTime = new Date(data.endTime);
    updateData.endTime = endTime;
    updateData.durationSeconds = Math.floor(
      (endTime.getTime() - session[0].startTime.getTime()) / 1000
    );
  }

  // Recalculate totals
  const totals = await db.select({
    totalTokens: sql<number>`sum(${tokenUsage.inputTokens} + ${tokenUsage.outputTokens})`,
    totalCost: sql<number>`sum(${tokenUsage.costUsd})`,
  })
    .from(tokenUsage)
    .where(eq(tokenUsage.sessionId, id));

  if (totals[0]) {
    updateData.totalTokens = totals[0].totalTokens || 0;
    updateData.totalCostUsd = totals[0].totalCost || 0;
  }

  await db.update(sessions)
    .set(updateData)
    .where(eq(sessions.id, id));

  return c.json({ message: 'Session updated' });
});

// DELETE /sessions/:id - Delete a session
app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  await db.delete(sessions).where(eq(sessions.id, id));

  return c.json({ message: 'Session deleted' });
});

export default app;
