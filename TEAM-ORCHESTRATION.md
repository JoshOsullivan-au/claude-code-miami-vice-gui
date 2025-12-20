# Claude Code Observatory - Team Orchestration Framework

## Project Metadata

**Project:** Claude Code Observatory
**Repo:** https://github.com/JoshOsullivan-au/claude-code-observatory
**Created:** 2024-12-21
**Status:** Active Development
**Framework:** Parallel Agent Orchestration

---

## Technology Stack (Finalized)

### Frontend Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 14+ (App Router) | React framework with SSR/SSG |
| UI Library | shadcn/ui | Component foundation |
| Styling | Tailwind CSS | Utility-first CSS |
| Charts | Recharts | Data visualization |
| Animations | animate-ui | Micro-interactions |
| Icons | Lucide React | Icon library |
| State | Zustand / TanStack Query | Client state + server cache |

### Additional UI Resources
| Resource | URL | Usage |
|----------|-----|-------|
| Magic UI | `npx @magicuidesign/cli@latest install claude` | AI-optimized components |
| UIverse | uiverse.io | Custom UI elements |
| React Bits | github.com/DavidHDev/react-bits | React utilities |
| Animate UI | github.com/imskyleen/animate-ui | Animation components |
| Dashboard Shell | `npx shadcn add dashboard-shell-04` | Pre-built dashboard layout |

### Backend Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Bun | Fast JS/TS runtime |
| Framework | Hono | Lightweight API framework |
| Database | SQLite + Drizzle ORM | Local-first persistence |
| Real-time | WebSocket (Bun native) | Live updates |
| Validation | Zod | Schema validation |

### MCP Integration
```bash
# Initialize shadcn MCP for Claude
npx shadcn@latest mcp init --client claude
```

---

## Agent Team Structure

### Team Composition

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PROJECT COORDINATOR                             │
│                    (Orchestration Agent)                             │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───▼───────────┐   ┌────▼────────┐   ┌───────▼───────┐
│  FRONTEND     │   │  BACKEND    │   │  INTEGRATION  │
│  SQUAD        │   │  SQUAD      │   │  SQUAD        │
└───┬───────────┘   └────┬────────┘   └───────┬───────┘
    │                    │                    │
┌───▼───┐ ┌───────┐  ┌───▼───┐ ┌─────┐   ┌───▼───┐ ┌─────┐
│UI Dev │ │UX Dev │  │API Dev│ │DB Dev│  │Hooks  │ │n8n  │
│Agent  │ │Agent  │  │Agent  │ │Agent │  │Agent  │ │Agent│
└───────┘ └───────┘  └───────┘ └─────┘   └───────┘ └─────┘
```

---

## Parallel Execution Framework

### Sprint 0: Project Setup (Current)

**Deploy 4 Parallel Agents:**

| Agent | Role | Task |
|-------|------|------|
| Frontend Architect | UI Setup | Next.js + shadcn/ui + Tailwind + Dashboard Shell |
| Backend Architect | API Setup | Bun + Hono + Drizzle ORM + SQLite |
| Hooks Developer | Integration | Claude Code hooks research + capture layer |
| Project Manager | Coordination | Documentation + Sprint planning |

---

## File Structure (Target)

```
claude-code-observatory/
├── README.md
├── TEAM-ORCHESTRATION.md
├── package.json                 # Root workspace config
├── turbo.json                   # Turborepo config
├── apps/
│   ├── web/                     # Next.js dashboard
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── sessions/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components
│   │   │   ├── charts/          # Recharts wrappers
│   │   │   └── dashboard/       # Dashboard components
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   └── styles/
│   │
│   └── api/                     # Bun + Hono API
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   │   ├── sessions.ts
│       │   │   ├── executions.ts
│       │   │   └── analytics.ts
│       │   ├── db/
│       │   │   ├── schema.ts
│       │   │   └── client.ts
│       │   └── websocket/
│       │       └── handler.ts
│       └── drizzle/
│           └── migrations/
│
├── packages/
│   ├── hooks/                   # Claude Code hooks
│   │   ├── src/
│   │   │   └── capture.ts
│   │   └── package.json
│   ├── shared/                  # Shared types
│   │   ├── src/
│   │   │   └── types.ts
│   │   └── package.json
│   └── ui/                      # Shared UI (optional)
│
└── docker/
    ├── Dockerfile.web
    ├── Dockerfile.api
    └── docker-compose.yml
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Build time | < 30s | Turborepo |
| Dashboard load | < 2s | Lighthouse |
| Real-time latency | < 100ms | WebSocket |
| Accessibility | WCAG AA | axe-core |

---

*Last Updated: 2024-12-21*
*Status: Agent Deployment In Progress*
