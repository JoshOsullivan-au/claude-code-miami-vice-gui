import { Hono } from 'hono';
import {
  getActiveAgents,
  getAgentsBySession,
  getAgentStats,
  getAgentDetails,
} from '../sync/agents';

const app = new Hono();

// GET /agents - List all recent agents
app.get('/', async (c) => {
  const minutes = parseInt(c.req.query('minutes') || '120');
  const agents = getActiveAgents(minutes);
  return c.json({
    agents,
    count: agents.length,
  });
});

// GET /agents/stats - Get agent statistics
app.get('/stats', async (c) => {
  const stats = getAgentStats();
  return c.json(stats);
});

// GET /agents/session/:sessionId - Get agents for a specific session
app.get('/session/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');
  const agents = getAgentsBySession(sessionId);
  return c.json({
    sessionId,
    agents,
    count: agents.length,
  });
});

// GET /agents/:agentId - Get specific agent details
app.get('/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  const agent = getAgentDetails(agentId);

  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  return c.json(agent);
});

export default app;
