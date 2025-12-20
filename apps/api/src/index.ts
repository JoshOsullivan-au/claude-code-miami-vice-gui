import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { z } from 'zod';
import sessionsRoutes from './routes/sessions';
import executionsRoutes from './routes/executions';
import analyticsRoutes from './routes/analytics';
import { websocketHandler, broadcast } from './websocket/handler';

// Schema for Claude Code hook payload
const hookPayloadSchema = z.object({
  tool_name: z.string().optional(),
  tool_input: z.record(z.unknown()).optional(),
  tool_response: z.unknown().optional(),
  session_id: z.string().optional(),
  type: z.enum(['tool_use', 'execution_completed', 'session_start', 'session_end']).optional(),
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
  return c.json({
    name: 'Claude Code Observatory API',
    version: '0.1.0',
    status: 'running',
    endpoints: {
      sessions: '/api/sessions',
      executions: '/api/executions',
      analytics: '/api/analytics',
      websocket: 'ws://localhost:3001/ws',
    },
  });
});

// Explicit health endpoint
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount routes
app.route('/api/sessions', sessionsRoutes);
app.route('/api/executions', executionsRoutes);
app.route('/api/analytics', analyticsRoutes);

// Hook endpoint for Claude Code hooks to call
app.post('/api/hook', async (c) => {
  try {
    const rawData = await c.req.json();

    // Validate payload with Zod
    const parseResult = hookPayloadSchema.safeParse(rawData);
    if (!parseResult.success) {
      console.warn('Invalid hook payload:', parseResult.error.issues);
      return c.json({ error: 'Invalid payload', issues: parseResult.error.issues }, 400);
    }

    const data = parseResult.data;

    // Broadcast to WebSocket clients
    broadcast({
      type: data.type || 'tool_use',
      data: data,
      timestamp: new Date().toISOString(),
    });

    return c.json({ received: true });
  } catch (error) {
    return c.json({ error: 'Invalid JSON' }, 400);
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
║  HTTP:      http://localhost:${port}                          ║
║  WebSocket: ws://localhost:${port}/ws                         ║
║  Status:    Running                                         ║
╚════════════════════════════════════════════════════════════╝
`);

console.log('Started development server: http://localhost:' + port);

// Bun server with WebSocket support
export default {
  port,
  fetch(req: Request, server: any) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade for /ws path
    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req);
      if (upgraded) {
        return undefined; // Bun handles the response
      }
      return new Response('WebSocket upgrade failed', { status: 400 });
    }

    // Handle regular HTTP requests with Hono
    return app.fetch(req);
  },
  websocket: websocketHandler,
};
