import type { ServerWebSocket } from 'bun';

// Store connected clients
const clients = new Set<ServerWebSocket<unknown>>();

export interface WebSocketMessage {
  type: 'session_started' | 'session_ended' | 'execution_started' | 'execution_completed' | 'token_usage';
  data: unknown;
  timestamp: string;
}

export const websocketHandler = {
  open(ws: ServerWebSocket<unknown>) {
    clients.add(ws);
    console.log(`WebSocket client connected. Total clients: ${clients.size}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to Claude Code Observatory',
      timestamp: new Date().toISOString(),
    }));
  },

  close(ws: ServerWebSocket<unknown>) {
    clients.delete(ws);
    console.log(`WebSocket client disconnected. Total clients: ${clients.size}`);
  },

  message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
    // Handle incoming messages (e.g., subscriptions)
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      }
    } catch {
      console.error('Failed to parse WebSocket message');
    }
  },
};

// Broadcast to all connected clients
export function broadcast(message: WebSocketMessage) {
  const payload = JSON.stringify(message);

  for (const client of clients) {
    try {
      client.send(payload);
    } catch (error) {
      console.error('Failed to send to client:', error);
      clients.delete(client);
    }
  }
}

// Helper functions for specific event types
export function broadcastSessionStart(sessionId: string, data: Record<string, unknown>) {
  broadcast({
    type: 'session_started',
    data: { sessionId, ...data },
    timestamp: new Date().toISOString(),
  });
}

export function broadcastSessionEnd(sessionId: string, data: Record<string, unknown>) {
  broadcast({
    type: 'session_ended',
    data: { sessionId, ...data },
    timestamp: new Date().toISOString(),
  });
}

export function broadcastExecutionStart(executionId: string, sessionId: string, toolName: string) {
  broadcast({
    type: 'execution_started',
    data: { executionId, sessionId, toolName },
    timestamp: new Date().toISOString(),
  });
}

export function broadcastExecutionComplete(executionId: string, data: Record<string, unknown>) {
  broadcast({
    type: 'execution_completed',
    data: { executionId, ...data },
    timestamp: new Date().toISOString(),
  });
}

export function broadcastTokenUsage(sessionId: string, data: Record<string, unknown>) {
  broadcast({
    type: 'token_usage',
    data: { sessionId, ...data },
    timestamp: new Date().toISOString(),
  });
}
