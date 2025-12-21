import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import { join, basename } from 'path';

// Claude Code projects directory
const PROJECTS_DIR = join(homedir(), '.claude', 'projects');

export interface TranscriptMessage {
  type: 'assistant' | 'user' | 'tool_result';
  uuid: string;
  parentUuid: string | null;
  timestamp: string;
  sessionId: string;
  model?: string;
  isSidechain?: boolean;
  agentId?: string;
  message?: {
    role: string;
    content: ContentBlock[];
    usage?: TokenUsage;
    stop_reason?: string;
  };
  toolUseResult?: {
    type: string;
    file?: {
      filePath: string;
      content?: string;
    };
  };
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking';
  text?: string;
  thinking?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string;
  tool_use_id?: string;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface ParsedEvent {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'user_message';
  timestamp: string;
  sessionId: string;
  model?: string;
  isAgent?: boolean;
  agentId?: string;
  // For thinking
  thinking?: string;
  // For tool calls
  toolName?: string;
  toolInput?: Record<string, unknown>;
  // For tool results
  toolResult?: string;
  filePath?: string;
  // For responses
  text?: string;
  // Token usage
  inputTokens?: number;
  outputTokens?: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export interface ActiveSession {
  sessionId: string;
  filePath: string;
  lastModified: Date;
  projectPath: string;
  eventCount: number;
  model?: string;
  isAgent: boolean;
}

function findProjectDirs(): string[] {
  if (!existsSync(PROJECTS_DIR)) return [];

  const dirs: string[] = [];
  const entries = readdirSync(PROJECTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs.push(join(PROJECTS_DIR, entry.name));
    }
  }

  return dirs;
}

function findRecentTranscripts(minutes: number = 30): { path: string; mtime: Date }[] {
  const transcripts: { path: string; mtime: Date }[] = [];
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);

  const projectDirs = findProjectDirs();

  for (const dir of projectDirs) {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const filePath = join(dir, file);
          const stats = statSync(filePath);
          if (stats.mtime > cutoff) {
            transcripts.push({ path: filePath, mtime: stats.mtime });
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  // Sort by modification time, most recent first
  transcripts.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return transcripts;
}

function parseTranscriptLine(line: string): TranscriptMessage | null {
  try {
    return JSON.parse(line) as TranscriptMessage;
  } catch {
    return null;
  }
}

function extractEvents(message: TranscriptMessage): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const baseEvent = {
    sessionId: message.sessionId,
    timestamp: message.timestamp,
    model: message.message?.model,
    isAgent: !!message.agentId,
    agentId: message.agentId,
  };

  if (message.type === 'assistant' && message.message?.content) {
    for (const block of message.message.content) {
      if (block.type === 'thinking' && block.thinking) {
        events.push({
          ...baseEvent,
          id: `${message.uuid}-thinking`,
          type: 'thinking',
          thinking: block.thinking,
        });
      } else if (block.type === 'text' && block.text) {
        events.push({
          ...baseEvent,
          id: `${message.uuid}-text`,
          type: 'response',
          text: block.text,
          inputTokens: message.message?.usage?.input_tokens,
          outputTokens: message.message?.usage?.output_tokens,
          cacheRead: message.message?.usage?.cache_read_input_tokens,
          cacheWrite: message.message?.usage?.cache_creation_input_tokens,
        });
      } else if (block.type === 'tool_use' && block.name) {
        events.push({
          ...baseEvent,
          id: block.id || `${message.uuid}-tool`,
          type: 'tool_call',
          toolName: block.name,
          toolInput: block.input,
        });
      }
    }
  } else if (message.type === 'user' && message.toolUseResult) {
    events.push({
      ...baseEvent,
      id: `${message.uuid}-result`,
      type: 'tool_result',
      filePath: message.toolUseResult.file?.filePath,
      toolResult: message.toolUseResult.file?.content?.slice(0, 500),
    });
  }

  return events;
}

export function getActiveSessions(): ActiveSession[] {
  const transcripts = findRecentTranscripts(60); // Last hour
  const sessions: ActiveSession[] = [];

  for (const { path: filePath, mtime } of transcripts.slice(0, 10)) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      if (lines.length === 0) continue;

      // Get first and last message for session info
      const firstMessage = parseTranscriptLine(lines[0]);
      const lastMessage = parseTranscriptLine(lines[lines.length - 1]);

      if (!firstMessage) continue;

      const fileName = basename(filePath);
      const isAgent = fileName.startsWith('agent-');

      sessions.push({
        sessionId: firstMessage.sessionId,
        filePath,
        lastModified: mtime,
        projectPath: basename(join(filePath, '..')),
        eventCount: lines.length,
        model: lastMessage?.message?.model,
        isAgent,
      });
    } catch {
      // Skip unreadable files
    }
  }

  return sessions;
}

export function getSessionEvents(sessionId: string, limit: number = 50): ParsedEvent[] {
  const transcripts = findRecentTranscripts(120); // Last 2 hours

  for (const { path: filePath } of transcripts) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      // Check if this file contains the session
      const firstLine = parseTranscriptLine(lines[0]);
      if (!firstLine || firstLine.sessionId !== sessionId) continue;

      // Parse all events from this transcript
      const allEvents: ParsedEvent[] = [];

      for (const line of lines) {
        const message = parseTranscriptLine(line);
        if (message) {
          const events = extractEvents(message);
          allEvents.push(...events);
        }
      }

      // Return most recent events
      return allEvents.slice(-limit).reverse();
    } catch {
      continue;
    }
  }

  return [];
}

export function getLiveEvents(limit: number = 100): ParsedEvent[] {
  const transcripts = findRecentTranscripts(30); // Last 30 minutes
  const allEvents: ParsedEvent[] = [];

  for (const { path: filePath } of transcripts.slice(0, 5)) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      // Parse last N lines from each transcript
      const recentLines = lines.slice(-20);

      for (const line of recentLines) {
        const message = parseTranscriptLine(line);
        if (message) {
          const events = extractEvents(message);
          allEvents.push(...events);
        }
      }
    } catch {
      continue;
    }
  }

  // Sort by timestamp and return most recent
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return allEvents.slice(0, limit);
}

export function getCurrentSessionEvents(limit: number = 50): {
  session: ActiveSession | null;
  events: ParsedEvent[];
} {
  const sessions = getActiveSessions();

  if (sessions.length === 0) {
    return { session: null, events: [] };
  }

  // Get most recently modified non-agent session
  const mainSession = sessions.find(s => !s.isAgent) || sessions[0];
  const events = getSessionEvents(mainSession.sessionId, limit);

  return { session: mainSession, events };
}
