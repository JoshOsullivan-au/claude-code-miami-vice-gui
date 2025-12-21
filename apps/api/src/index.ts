import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { z } from 'zod';
import { readFileSync, existsSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import sessionsRoutes from './routes/sessions';
import executionsRoutes from './routes/executions';
import analyticsRoutes from './routes/analytics';
import syncRoutes from './routes/sync';
import mcpsRoutes from './routes/mcps';
import liveRoutes from './routes/live';
import agentsRoutes from './routes/agents';

// Events file path
const EVENTS_FILE = join(homedir(), '.claude-observatory', 'events.jsonl');

// Schema for event entries
const eventSchema = z.object({
  tool_name: z.string().optional(),
  tool_input: z.record(z.unknown()).optional(),
  tool_response: z.unknown().optional(),
  session_id: z.string().optional(),
}).passthrough();

// Create Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  const fileExists = existsSync(EVENTS_FILE);
  const fileStats = fileExists ? statSync(EVENTS_FILE) : null;

  return c.json({
    name: 'Claude Code Observatory API',
    version: '0.2.0',
    status: 'running',
    eventsFile: EVENTS_FILE,
    eventsFileExists: fileExists,
    eventsFileSize: fileStats?.size || 0,
    endpoints: {
      events: '/api/events',
      sessions: '/api/sessions',
      executions: '/api/executions',
      analytics: '/api/analytics',
    },
  });
});

// Explicit health endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    eventsFile: existsSync(EVENTS_FILE) ? 'found' : 'not found',
  });
});

// Mount routes
app.route('/api/sessions', sessionsRoutes);
app.route('/api/executions', executionsRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/sync', syncRoutes);
app.route('/api/mcps', mcpsRoutes);
app.route('/api/live', liveRoutes);
app.route('/api/agents', agentsRoutes);

// Events endpoint - reads from JSONL file
app.get('/api/events', async (c) => {
  try {
    if (!existsSync(EVENTS_FILE)) {
      return c.json({
        events: [],
        total: 0,
        file: EVENTS_FILE,
        message: 'No events file found. Run Claude Code with the hook enabled to capture events.',
      });
    }

    const content = readFileSync(EVENTS_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    // Parse each line as JSON, skip invalid lines
    const events = lines
      .map((line, index) => {
        try {
          const parsed = JSON.parse(line);
          return {
            id: index + 1,
            timestamp: parsed.timestamp || new Date().toISOString(),
            ...parsed,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse(); // Most recent first

    // Optional: limit results
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');
    const paginatedEvents = events.slice(offset, offset + limit);

    return c.json({
      events: paginatedEvents,
      total: events.length,
      limit,
      offset,
      file: EVENTS_FILE,
    });
  } catch (error) {
    console.error('Error reading events file:', error);
    return c.json({ error: 'Failed to read events file' }, 500);
  }
});

// Events stats endpoint
app.get('/api/events/stats', async (c) => {
  try {
    if (!existsSync(EVENTS_FILE)) {
      return c.json({ total: 0, tools: {}, file: EVENTS_FILE });
    }

    const content = readFileSync(EVENTS_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    const toolCounts: Record<string, number> = {};
    let total = 0;

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const toolName = parsed.tool_name || 'unknown';
        toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
        total++;
      } catch {
        // Skip invalid lines
      }
    }

    return c.json({
      total,
      tools: toolCounts,
      file: EVENTS_FILE,
      fileSize: statSync(EVENTS_FILE).size,
    });
  } catch (error) {
    return c.json({ error: 'Failed to read stats' }, 500);
  }
});

// Error handling
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

const port = parseInt(process.env.PORT || '3001');

console.log(`
╔════════════════════════════════════════════════════════════╗
║           Claude Code Observatory API                       ║
╠════════════════════════════════════════════════════════════╣
║  HTTP:       http://localhost:${port}                         ║
║  Events:     ${EVENTS_FILE}
║  Status:     Running (file-based capture)                  ║
╚════════════════════════════════════════════════════════════╝
`);

console.log('Started development server: http://localhost:' + port);

// Simple Bun server - no WebSocket needed
export default {
  port,
  fetch: app.fetch,
};
