import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { db } from '../db/client';
import { sessions, tokenUsage } from '../db/schema';
import { eq } from 'drizzle-orm';

// Anthropic pricing per 1M tokens (as of Dec 2024)
const MODEL_PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  'claude-opus-4-5-20251101': { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
  // Fallback for unknown models
  'default': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
};

// Stats cache file location
const STATS_CACHE_PATH = join(homedir(), '.claude', 'stats-cache.json');

interface DailyModelTokens {
  date: string;
  tokensByModel: Record<string, number>;
}

interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

interface StatsCache {
  version: number;
  lastComputedDate: string;
  dailyModelTokens: DailyModelTokens[];
  modelUsage: Record<string, ModelUsage>;
  totalSessions: number;
  totalMessages: number;
}

function getPricing(model: string) {
  return MODEL_PRICING[model] || MODEL_PRICING['default'];
}

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheRead: number = 0,
  cacheWrite: number = 0
): number {
  const pricing = getPricing(model);
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cacheReadCost = (cacheRead / 1_000_000) * pricing.cacheRead;
  const cacheWriteCost = (cacheWrite / 1_000_000) * pricing.cacheWrite;
  return inputCost + outputCost + cacheReadCost + cacheWriteCost;
}

function normalizeModelName(model: string): string {
  // Convert full model IDs to display names
  if (model.includes('opus')) return 'opus';
  if (model.includes('sonnet')) return 'sonnet';
  if (model.includes('haiku')) return 'haiku';
  return model;
}

export async function syncFromStatsCache(): Promise<{
  success: boolean;
  sessionsCreated: number;
  tokenRecordsCreated: number;
  totalCost: number;
  error?: string;
}> {
  if (!existsSync(STATS_CACHE_PATH)) {
    return {
      success: false,
      sessionsCreated: 0,
      tokenRecordsCreated: 0,
      totalCost: 0,
      error: `Stats cache not found at ${STATS_CACHE_PATH}`,
    };
  }

  try {
    const content = readFileSync(STATS_CACHE_PATH, 'utf-8');
    const stats: StatsCache = JSON.parse(content);

    let sessionsCreated = 0;
    let tokenRecordsCreated = 0;
    let totalCost = 0;

    // Process daily model tokens - create a session per day
    for (const daily of stats.dailyModelTokens) {
      const dateStr = daily.date;
      const sessionId = `daily-${dateStr}`;

      // Check if session already exists
      const existing = await db.select().from(sessions).where(eq(sessions.id, sessionId));

      if (existing.length === 0) {
        // Create session for this day
        const sessionDate = new Date(dateStr);

        // Calculate total tokens and cost for this day
        let dayTotalTokens = 0;
        let dayCost = 0;

        for (const [model, tokens] of Object.entries(daily.tokensByModel)) {
          dayTotalTokens += tokens;
          // Estimate 30% input, 70% output split for daily aggregates
          const inputTokens = Math.floor(tokens * 0.3);
          const outputTokens = Math.floor(tokens * 0.7);
          dayCost += calculateCost(model, inputTokens, outputTokens);
        }

        await db.insert(sessions).values({
          id: sessionId,
          startTime: sessionDate,
          endTime: sessionDate,
          durationSeconds: 86400, // Full day
          model: Object.keys(daily.tokensByModel)[0] ? normalizeModelName(Object.keys(daily.tokensByModel)[0]) : 'mixed',
          workingDirectory: homedir(),
          totalTokens: dayTotalTokens,
          totalCostUsd: dayCost,
          status: 'completed',
          createdAt: new Date(),
        });
        sessionsCreated++;

        // Create token usage records for each model used that day
        for (const [model, tokens] of Object.entries(daily.tokensByModel)) {
          const inputTokens = Math.floor(tokens * 0.3);
          const outputTokens = Math.floor(tokens * 0.7);
          const cost = calculateCost(model, inputTokens, outputTokens);

          await db.insert(tokenUsage).values({
            id: nanoid(),
            sessionId,
            model: normalizeModelName(model),
            inputTokens,
            outputTokens,
            thinkingTokens: 0,
            cacheReadTokens: 0,
            cacheWriteTokens: 0,
            costUsd: cost,
            timestamp: sessionDate,
          });
          tokenRecordsCreated++;
          totalCost += cost;
        }
      }
    }

    // Also sync aggregate model usage for overall stats
    // Create a summary session for total usage if we have model-level data
    const summarySessionId = 'aggregate-totals';
    const existingSummary = await db.select().from(sessions).where(eq(sessions.id, summarySessionId));

    if (existingSummary.length === 0 && stats.modelUsage) {
      let aggregateTotalTokens = 0;
      let aggregateCost = 0;

      for (const [model, usage] of Object.entries(stats.modelUsage)) {
        const cost = calculateCost(
          model,
          usage.inputTokens,
          usage.outputTokens,
          usage.cacheReadInputTokens,
          usage.cacheCreationInputTokens
        );
        aggregateTotalTokens += usage.inputTokens + usage.outputTokens;
        aggregateCost += cost;
      }

      await db.insert(sessions).values({
        id: summarySessionId,
        startTime: new Date(stats.dailyModelTokens[0]?.date || new Date()),
        endTime: new Date(),
        durationSeconds: 0,
        model: 'mixed',
        workingDirectory: homedir(),
        totalTokens: aggregateTotalTokens,
        totalCostUsd: aggregateCost,
        status: 'completed',
        createdAt: new Date(),
      });
      sessionsCreated++;

      // Create detailed token usage for aggregate data
      for (const [model, usage] of Object.entries(stats.modelUsage)) {
        const cost = calculateCost(
          model,
          usage.inputTokens,
          usage.outputTokens,
          usage.cacheReadInputTokens,
          usage.cacheCreationInputTokens
        );

        await db.insert(tokenUsage).values({
          id: nanoid(),
          sessionId: summarySessionId,
          model: normalizeModelName(model),
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          thinkingTokens: 0,
          cacheReadTokens: usage.cacheReadInputTokens,
          cacheWriteTokens: usage.cacheCreationInputTokens,
          costUsd: cost,
          timestamp: new Date(),
        });
        tokenRecordsCreated++;
        totalCost += cost;
      }
    }

    return {
      success: true,
      sessionsCreated,
      tokenRecordsCreated,
      totalCost,
    };
  } catch (error) {
    return {
      success: false,
      sessionsCreated: 0,
      tokenRecordsCreated: 0,
      totalCost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getStatsInfo(): Promise<{
  exists: boolean;
  path: string;
  lastUpdated?: string;
  totalSessions?: number;
  models?: string[];
}> {
  if (!existsSync(STATS_CACHE_PATH)) {
    return { exists: false, path: STATS_CACHE_PATH };
  }

  try {
    const content = readFileSync(STATS_CACHE_PATH, 'utf-8');
    const stats: StatsCache = JSON.parse(content);

    return {
      exists: true,
      path: STATS_CACHE_PATH,
      lastUpdated: stats.lastComputedDate,
      totalSessions: stats.totalSessions,
      models: Object.keys(stats.modelUsage || {}),
    };
  } catch {
    return { exists: true, path: STATS_CACHE_PATH };
  }
}
