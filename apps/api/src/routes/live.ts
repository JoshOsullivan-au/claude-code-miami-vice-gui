import { Hono } from 'hono';
import {
  getActiveSessions,
  getSessionEvents,
  getLiveEvents,
  getCurrentSessionEvents,
} from '../sync/transcript-watcher';

const app = new Hono();

// GET /live/sessions - List active sessions
app.get('/sessions', async (c) => {
  const sessions = getActiveSessions();
  return c.json({
    sessions,
    count: sessions.length,
  });
});

// GET /live/events - Get recent events across all sessions
app.get('/events', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const events = getLiveEvents(limit);
  return c.json({
    events,
    count: events.length,
  });
});

// GET /live/current - Get current session with events
app.get('/current', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const result = getCurrentSessionEvents(limit);
  return c.json(result);
});

// GET /live/session/:sessionId - Get events for specific session
app.get('/session/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const limit = parseInt(c.req.query('limit') || '50');
  const events = getSessionEvents(sessionId, limit);
  return c.json({
    sessionId,
    events,
    count: events.length,
  });
});

export default app;
