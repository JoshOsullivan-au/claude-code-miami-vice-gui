# Claude Code Miami Vice GUI

<img width="1637" alt="Dashboard Screenshot" src="https://github.com/user-attachments/assets/3030e0d4-9955-4e2a-8f0a-0ce1920d0be6" />

A sleek, locally-hosted web dashboard for monitoring your Claude Code sessions in real-time. Track token usage, costs, agents, and live activity through a retro Miami 80's inspired interface.

**No API keys required. No external services. Everything runs locally.**

## What is this?

Claude Code Miami Vice GUI is a browser-based monitoring dashboard that reads directly from Claude Code's local files. Open it alongside your terminal and watch your AI coding sessions unfold in real-time with neon-lit visualisations.

### Key Features

| Feature | Description |
|---------|-------------|
| **Live Feed** | Watch thinking blocks, tool calls, and responses as they happen |
| **Agent Tracking** | Monitor spawned sub-agents with auto-generated names and activity |
| **Cost Analytics** | Track spending across Opus, Sonnet, and Haiku models |
| **Token Usage** | Visualise input/output/cache tokens over time |
| **MCP Servers** | View your configured Model Context Protocol servers |
| **Session History** | Browse past sessions with execution logs |

## Quick Start

### Prerequisites

- **Node.js 18+**
- **Bun runtime**: `curl -fsSL https://bun.sh/install | bash`
- **Claude Code CLI** installed and used at least once

### Installation

```bash
# Clone the repository
git clone https://github.com/JoshOsullivan-au/claude-code-miami-vice-gui.git
cd claude-code-miami-vice-gui

# Install dependencies
npm install --legacy-peer-deps

# Set up the database
cd apps/api
bun run db:generate
bun run db:push
cd ../..

# Start the dashboard
npm run dev
```

Open your browser:
- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001

## How It Works

The dashboard reads directly from Claude Code's local storage:

| Data Source | Location | Purpose |
|-------------|----------|---------|
| Stats Cache | `~/.claude/stats-cache.json` | Token usage and costs |
| Transcripts | `~/.claude/projects/*/*.jsonl` | Session history and live events |
| Agent Files | `~/.claude/projects/*/agent-*.jsonl` | Agent monitoring |
| MCP Config | `~/.claude/mcp.json` | MCP server configuration |

## Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with stats, charts, and recent activity |
| **Sessions** | Browse all Claude Code sessions |
| **Live Feed** | Real-time session monitoring with thinking visualisation |
| **Token Costs** | Cost analytics and model breakdown |
| **Agents** | Monitor spawned sub-agents (Explore, Plan, Code-Review) |
| **MCPs** | View configured MCP servers |
| **Analytics** | Historical charts and trends |

## Demo Mode

Click the eye icon in the header to toggle demo mode. This displays sample data instead of your actual usage - useful for screenshots or testing.

## Tech Stack

**Frontend**: Next.js 14, Tailwind CSS, shadcn/ui, Recharts
**Backend**: Bun, Hono, SQLite, Drizzle ORM
**Build**: Turborepo monorepo

## Design System

The Miami Vice aesthetic features:
- **Neon Pink** `#FF00FF` - Primary accent
- **Neon Blue** `#00FFFF` - Secondary accent
- **Neon Purple** `#BD00FF` - Tertiary accent
- **Glass cards** with blur effects
- **Righteous** display font
- **Orbitron** mono font for data

## API Endpoints

```
GET  /api/live/current     - Current session with events
GET  /api/live/sessions    - Active sessions
GET  /api/agents           - List recent agents
GET  /api/agents/stats     - Agent statistics
GET  /api/mcps             - List MCP servers
POST /api/sync/run         - Sync stats from Claude
```

## Troubleshooting

**No data showing?**
1. Ensure Claude Code has been used at least once
2. Call `POST /api/sync/run` to sync data
3. Check `~/.claude/stats-cache.json` exists

**Live feed not updating?**
1. Ensure a Claude Code session is active
2. Check API is running on port 3001

## Development

```bash
npm run dev                          # Run both frontend and backend
npm run dev --workspace=apps/web     # Frontend only
npm run dev --workspace=apps/api     # API only
```

## License

MIT

## Author

Josh O'Sullivan - [AI Institute](https://instituteai.io)
