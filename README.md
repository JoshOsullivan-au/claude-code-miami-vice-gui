# Claude Code Observatory

A locally-hosted dashboard for monitoring Claude Code executions, token usage, and cost analytics. Built with a Miami 80's retro aesthetic.

## Features

- **Session Tracking**: Monitor all Claude Code sessions with start/end times, duration, and model used
- **Token Analytics**: Track input/output tokens across Opus, Sonnet, and Haiku models
- **Cost Monitoring**: Real-time and historical cost tracking with daily/weekly/monthly views
- **Live Feed**: WebSocket-powered real-time activity stream
- **Execution Logging**: Track tool calls, parameters, duration, and success/failure status

## Tech Stack

### Frontend (`apps/web`)
- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui with custom retro theming
- **Styling**: Tailwind CSS with Miami 80's design system
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Charts**: Recharts

### Backend (`apps/api`)
- **Runtime**: Bun
- **Framework**: Hono
- **Database**: SQLite with Drizzle ORM
- **Real-time**: WebSocket (Bun native)
- **Validation**: Zod

### Shared (`packages/shared`)
- TypeScript type definitions shared between frontend and backend

## Miami 80's Design System

The dashboard features a distinctive retro aesthetic:

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Neon Pink | `#FF00FF` | Primary accent, CTAs |
| Neon Blue | `#00FFFF` | Secondary accent, data |
| Neon Purple | `#BD00FF` | Tertiary accent |
| Neon Orange | `#FF9900` | Warnings, highlights |
| Retro BG | `#0f0c29` | Background base |

### Typography
- **Display**: Righteous (headings, titles)
- **Mono**: Orbitron (data, stats, timestamps)
- **Sans**: Inter (body text)

### Visual Effects
- Glass card blur effects
- Neon glow shadows
- Animated perspective grid background
- Custom scrollbars
- Status dot indicators with pulse animations

## Project Structure

```
claude-code-observatory/
├── apps/
│   ├── api/                    # Bun + Hono API server
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry point
│   │   │   ├── routes/         # API routes
│   │   │   ├── db/             # Drizzle schema & connection
│   │   │   └── websocket/      # WebSocket handlers
│   │   └── drizzle/            # Database migrations
│   │
│   └── web/                    # Next.js dashboard
│       ├── app/                # App Router pages
│       │   ├── dashboard/      # Main dashboard
│       │   ├── analytics/      # Analytics views
│       │   └── settings/       # Settings page
│       ├── components/
│       │   ├── ui/             # shadcn components
│       │   ├── charts/         # Recharts wrappers
│       │   └── dashboard/      # Dashboard components
│       ├── lib/                # Utilities, API client, store
│       └── styles/             # Global CSS with retro system
│
├── packages/
│   └── shared/                 # Shared TypeScript types
│
├── DESIGN-SYSTEM.md            # Design system documentation
├── TEAM-ORCHESTRATION.md       # Development workflow docs
├── turbo.json                  # Turborepo configuration
└── package.json                # Root workspace config
```

## Installation

### Prerequisites
- Node.js 18+
- Bun runtime (`curl -fsSL https://bun.sh/install | bash`)

### Setup

```bash
# Clone the repository
git clone https://github.com/JoshOsullivan-au/claude-code-observatory.git
cd claude-code-observatory

# Install dependencies
npm install --legacy-peer-deps

# Set up the database
cd apps/api
bun run db:generate
bun run db:push
cd ../..
```

## Development

```bash
# Run both frontend and backend in development mode
npm run dev

# Or run individually:
npm run dev --workspace=apps/web    # Frontend on http://localhost:3000
npm run dev --workspace=apps/api    # API on http://localhost:3001
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/:id` | Get session details |
| POST | `/api/sessions` | Create new session |
| PATCH | `/api/sessions/:id` | Update session |
| GET | `/api/analytics/summary` | Get analytics summary |
| GET | `/api/analytics/daily` | Get daily data |
| GET | `/api/costs` | Get cost breakdown |
| WS | `/ws` | WebSocket for real-time updates |

## Database Schema

### Sessions
- `id`: UUID primary key
- `start_time`: Session start timestamp
- `end_time`: Session end timestamp
- `model`: Model used (opus/sonnet/haiku)
- `working_directory`: Project path
- `git_branch`: Git branch name
- `total_tokens`: Cumulative token count
- `total_cost_usd`: Cumulative cost
- `status`: active/completed/failed

### Executions
- `id`: UUID primary key
- `session_id`: Foreign key to sessions
- `tool_name`: Name of tool called
- `parameters`: JSON parameters
- `duration_ms`: Execution duration
- `input_tokens`: Input token count
- `output_tokens`: Output token count
- `status`: pending/completed/failed

### Token Usage
- `id`: UUID primary key
- `session_id`: Foreign key to sessions
- `model`: Model identifier
- `input_tokens`: Input tokens used
- `output_tokens`: Output tokens generated
- `thinking_tokens`: Extended thinking tokens
- `cache_read_tokens`: Cache read tokens
- `cache_write_tokens`: Cache write tokens
- `cost_usd`: Cost for this usage

## Configuration

### Environment Variables

Create `.env` files in respective app directories:

**apps/api/.env**
```env
DATABASE_URL=./observatory.db
PORT=3001
```

**apps/web/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Roadmap

- [x] Core monitoring dashboard
- [x] Session and execution tracking
- [x] Token usage analytics
- [x] Cost breakdown charts
- [x] Real-time WebSocket updates
- [x] Miami 80's retro design system
- [ ] Claude Code hooks integration
- [ ] Thinking process visualization
- [ ] n8n automation workflows
- [ ] Export/reporting functionality
- [ ] Budget alerts

## License

MIT

## Author

Josh O'Sullivan - AI Institute
