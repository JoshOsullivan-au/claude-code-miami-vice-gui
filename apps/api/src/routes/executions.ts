import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { executions, sessions, tokenUsage } from '../db/schema';

const app = new Hono();

// Schema for creating an execution
const createExecutionSchema = z.object({
  sessionId: z.string(),
  toolName: z.string(),
  parameters: z.record(z.unknown()).optional(),
});

// Schema for completing an execution
const completeExecutionSchema = z.object({
  durationMs: z.number().optional(),
  status: z.enum(['success', 'error']),
  errorMessage: z.string().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  thinkingTokens: z.number().optional(),
});

// GET /executions - List executions with optional session filter
app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');
  const sessionId = c.req.query('sessionId');

  const conditions = sessionId ? eq(executions.sessionId, sessionId) : undefined;

  const result = await db.select()
    .from(executions)
    .where(conditions)
    .orderBy(desc(executions.timestamp))
    .limit(limit)
    .offset(offset);

  return c.json({ executions: result });
});

// GET /executions/:id - Get a specific execution
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const result = await db.select()
    .from(executions)
    .where(eq(executions.id, id))
    .limit(1);

  if (!result.length) {
    return c.json({ error: 'Execution not found' }, 404);
  }

  return c.json(result[0]);
});

// POST /executions - Create a new execution (called by hooks)
app.post('/', zValidator('json', createExecutionSchema), async (c) => {
  const data = c.req.valid('json');
  const id = nanoid();
  const now = new Date();

  // Verify session exists
  const session = await db.select()
    .from(sessions)
    .where(eq(sessions.id, data.sessionId))
    .limit(1);

  if (!session.length) {
    return c.json({ error: 'Session not found' }, 404);
  }

  await db.insert(executions).values({
    id,
    sessionId: data.sessionId,
    toolName: data.toolName,
    parameters: data.parameters,
    timestamp: now,
    status: 'pending',
  });

  return c.json({ id, message: 'Execution created' }, 201);
});

// PATCH /executions/:id - Complete an execution
app.patch('/:id', zValidator('json', completeExecutionSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const execution = await db.select()
    .from(executions)
    .where(eq(executions.id, id))
    .limit(1);

  if (!execution.length) {
    return c.json({ error: 'Execution not found' }, 404);
  }

  // Get session for model info
  const session = await db.select()
    .from(sessions)
    .where(eq(sessions.id, execution[0].sessionId))
    .limit(1);

  // Calculate cost based on model pricing
  const costUsd = calculateCost(
    session[0]?.model || 'sonnet',
    data.inputTokens || 0,
    data.outputTokens || 0,
    data.thinkingTokens || 0
  );

  await db.update(executions)
    .set({
      durationMs: data.durationMs,
      status: data.status,
      errorMessage: data.errorMessage,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      costUsd,
    })
    .where(eq(executions.id, id));

  // Record token usage
  if (data.inputTokens || data.outputTokens) {
    await db.insert(tokenUsage).values({
      id: nanoid(),
      sessionId: execution[0].sessionId,
      executionId: id,
      model: session[0]?.model || 'sonnet',
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      thinkingTokens: data.thinkingTokens || 0,
      costUsd,
      timestamp: new Date(),
    });
  }

  return c.json({ message: 'Execution updated' });
});

// Cost calculation helper (prices per 1M tokens as of 2024)
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  thinkingTokens: number = 0
): number {
  const pricing: Record<string, { input: number; output: number; thinking?: number }> = {
    opus: { input: 15, output: 75, thinking: 75 },
    sonnet: { input: 3, output: 15, thinking: 15 },
    haiku: { input: 0.25, output: 1.25 },
  };

  const prices = pricing[model] || pricing.sonnet;

  const inputCost = (inputTokens / 1_000_000) * prices.input;
  const outputCost = (outputTokens / 1_000_000) * prices.output;
  const thinkingCost = (thinkingTokens / 1_000_000) * (prices.thinking || prices.output);

  return inputCost + outputCost + thinkingCost;
}

export default app;
