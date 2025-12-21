import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import { join, basename } from 'path';

const PROJECTS_DIR = join(homedir(), '.claude', 'projects');

export interface AgentInfo {
  agentId: string;
  sessionId: string;
  name: string;
  model: string;
  status: 'active' | 'completed' | 'unknown';
  messageCount: number;
  toolCalls: number;
  startTime: string;
  lastActivity: string;
  projectPath: string;
  filePath: string;
  firstMessage?: string;
  type: 'explore' | 'plan' | 'code-review' | 'general' | 'unknown';
}

export interface AgentStats {
  total: number;
  active: number;
  completed: number;
  byModel: Record<string, number>;
  byType: Record<string, number>;
}

interface TranscriptEntry {
  type: 'user' | 'assistant';
  uuid: string;
  timestamp: string;
  sessionId: string;
  agentId?: string;
  slug?: string;
  isSidechain?: boolean;
  message?: {
    role: string;
    model?: string;
    content: string | Array<{
      type: string;
      text?: string;
      name?: string;
    }>;
  };
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

function findAgentFiles(minutes: number = 120): { path: string; mtime: Date }[] {
  const agentFiles: { path: string; mtime: Date }[] = [];
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);

  const projectDirs = findProjectDirs();

  for (const dir of projectDirs) {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        if (file.startsWith('agent-') && file.endsWith('.jsonl')) {
          const filePath = join(dir, file);
          const stats = statSync(filePath);
          if (stats.mtime > cutoff) {
            agentFiles.push({ path: filePath, mtime: stats.mtime });
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  // Sort by modification time, most recent first
  agentFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return agentFiles;
}

function inferAgentType(firstMessage: string): AgentInfo['type'] {
  const lower = firstMessage.toLowerCase();

  if (lower.includes('explore') || lower.includes('search') || lower.includes('find')) {
    return 'explore';
  }
  if (lower.includes('plan') || lower.includes('architect') || lower.includes('design')) {
    return 'plan';
  }
  if (lower.includes('review') || lower.includes('audit') || lower.includes('check')) {
    return 'code-review';
  }
  if (lower.includes('warmup') || lower === 'warmup') {
    return 'general';
  }

  return 'unknown';
}

function extractMessageContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    const textBlock = content.find(c => c.type === 'text');
    return textBlock?.text || '';
  }
  return '';
}

function formatSlugAsName(slug: string): string {
  // Convert "greedy-juggling-valley" to "Greedy Juggling Valley"
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseAgentFile(filePath: string, mtime: Date): AgentInfo | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    if (lines.length === 0) return null;

    let agentId = '';
    let sessionId = '';
    let slug = '';
    let model = 'unknown';
    let startTime = '';
    let lastActivity = '';
    let messageCount = 0;
    let toolCalls = 0;
    let firstUserMessage = '';

    for (const line of lines) {
      try {
        const entry: TranscriptEntry = JSON.parse(line);

        if (!agentId && entry.agentId) {
          agentId = entry.agentId;
        }
        if (!sessionId && entry.sessionId) {
          sessionId = entry.sessionId;
        }
        if (!slug && entry.slug) {
          slug = entry.slug;
        }
        if (!startTime && entry.timestamp) {
          startTime = entry.timestamp;
        }
        if (entry.timestamp) {
          lastActivity = entry.timestamp;
        }

        if (entry.type === 'user') {
          messageCount++;
          if (!firstUserMessage && entry.message?.content) {
            firstUserMessage = extractMessageContent(entry.message.content);
          }
        }

        if (entry.type === 'assistant') {
          messageCount++;
          if (entry.message?.model) {
            model = entry.message.model;
          }
          if (entry.message?.content && Array.isArray(entry.message.content)) {
            for (const block of entry.message.content) {
              if (block.type === 'tool_use') {
                toolCalls++;
              }
            }
          }
        }
      } catch {
        // Skip invalid lines
      }
    }

    if (!agentId) return null;

    // Determine if agent is still active (modified in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const status = mtime > fiveMinutesAgo ? 'active' : 'completed';

    const fileName = basename(filePath);
    const projectPath = basename(join(filePath, '..'));

    // Generate name from slug or fallback to agentId
    const name = slug ? formatSlugAsName(slug) : `Agent ${agentId.slice(0, 8)}`;

    return {
      agentId,
      sessionId,
      name,
      model: normalizeModelName(model),
      status,
      messageCount,
      toolCalls,
      startTime,
      lastActivity,
      projectPath,
      filePath,
      firstMessage: firstUserMessage.slice(0, 200),
      type: inferAgentType(firstUserMessage),
    };
  } catch {
    return null;
  }
}

function normalizeModelName(model: string): string {
  if (model.includes('opus')) return 'opus';
  if (model.includes('sonnet')) return 'sonnet';
  if (model.includes('haiku')) return 'haiku';
  return model;
}

export function getActiveAgents(minutes: number = 120): AgentInfo[] {
  const agentFiles = findAgentFiles(minutes);
  const agents: AgentInfo[] = [];

  for (const { path, mtime } of agentFiles) {
    const agent = parseAgentFile(path, mtime);
    if (agent) {
      agents.push(agent);
    }
  }

  return agents;
}

export function getAgentsBySession(sessionId: string): AgentInfo[] {
  const allAgents = getActiveAgents(240); // Last 4 hours
  return allAgents.filter(a => a.sessionId === sessionId);
}

export function getAgentStats(): AgentStats {
  const agents = getActiveAgents(120);

  const byModel: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let active = 0;
  let completed = 0;

  for (const agent of agents) {
    // Count by status
    if (agent.status === 'active') {
      active++;
    } else {
      completed++;
    }

    // Count by model
    byModel[agent.model] = (byModel[agent.model] || 0) + 1;

    // Count by type
    byType[agent.type] = (byType[agent.type] || 0) + 1;
  }

  return {
    total: agents.length,
    active,
    completed,
    byModel,
    byType,
  };
}

export function getAgentDetails(agentId: string): AgentInfo | null {
  const agents = getActiveAgents(240);
  return agents.find(a => a.agentId === agentId) || null;
}
