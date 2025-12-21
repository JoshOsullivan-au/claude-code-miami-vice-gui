import { Hono } from 'hono';
import { getMcpServers, getMcpServerDetails, getMcpStats } from '../sync/mcp-servers';

const app = new Hono();

// GET /mcps - List all MCP servers
app.get('/', async (c) => {
  const result = getMcpServers();
  return c.json(result);
});

// GET /mcps/stats - Get MCP statistics
app.get('/stats', async (c) => {
  const stats = getMcpStats();
  return c.json(stats);
});

// GET /mcps/:name - Get details for a specific server
app.get('/:name', async (c) => {
  const name = c.req.param('name');
  const result = getMcpServerDetails(name);

  if (!result.found) {
    return c.json({ error: result.error }, 404);
  }

  return c.json(result.server);
});

export default app;
