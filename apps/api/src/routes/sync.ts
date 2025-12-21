import { Hono } from 'hono';
import { syncFromStatsCache, getStatsInfo } from '../sync/claude-stats';

const app = new Hono();

// GET /sync/status - Check sync source status
app.get('/status', async (c) => {
  const info = await getStatsInfo();
  return c.json(info);
});

// POST /sync/run - Trigger sync from stats-cache.json
app.post('/run', async (c) => {
  console.log('[Sync] Starting sync from Claude stats-cache.json...');

  const result = await syncFromStatsCache();

  if (result.success) {
    console.log(`[Sync] Complete: ${result.sessionsCreated} sessions, ${result.tokenRecordsCreated} token records, $${result.totalCost.toFixed(4)} total cost`);
  } else {
    console.error(`[Sync] Failed: ${result.error}`);
  }

  return c.json(result);
});

// GET /sync/preview - Preview what would be synced without making changes
app.get('/preview', async (c) => {
  const info = await getStatsInfo();

  if (!info.exists) {
    return c.json({
      canSync: false,
      reason: 'Stats cache file not found',
      path: info.path,
    });
  }

  return c.json({
    canSync: true,
    source: info.path,
    lastUpdated: info.lastUpdated,
    totalSessions: info.totalSessions,
    models: info.models,
    message: 'POST to /api/sync/run to import data',
  });
});

export default app;
