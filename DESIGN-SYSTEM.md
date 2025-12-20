# Miami 80's Retro Design System

## Implementation Plan for Claude Code Observatory

**Source:** Google AI Studio Export (`/Volumes/128GB LARGE/Claude/Claude Code Observatory/`)
**Target:** `/Users/home/Developer/claude-code-observatory/apps/web/`

---

## Design System Overview

### Color Palette

```css
/* Miami Retro Colors */
--neon-pink: #FF00FF;      /* Hot Magenta - Primary accent */
--neon-blue: #00FFFF;      /* Cyan - Secondary accent */
--neon-purple: #BD00FF;    /* Purple - Tertiary accent */
--tertiary: #FF9900;       /* Sunset Orange - Warnings */
--quaternary: #FFFF00;     /* Electric Yellow - Highlights */

/* Backgrounds */
--retro-bg: #0f0c29;       /* Deep Purple Night */
--retro-bg-grad-start: #302b63;
--retro-bg-grad-end: #24243e;
--surface-dark: #1A1A2E;   /* Card backgrounds */
--surface-card: rgba(26, 26, 46, 0.6);  /* Glass effect */
```

### Typography

| Usage | Font | Weight | Style |
|-------|------|--------|-------|
| Headings | Righteous | 400 | Retro display, uppercase |
| Body | Inter | 300-700 | Clean sans-serif |
| Data/Stats | Orbitron | 400-900 | Monospace retro |

```css
font-display: ["Righteous", "cursive"]
font-sans: ["Inter", "sans-serif"]
font-mono: ["Orbitron", "monospace"]
```

### Visual Effects

1. **Glass Cards** - Frosted glass with blur
2. **Neon Glow Shadows** - Colored box-shadows
3. **Retro Grid** - Perspective animated grid background
4. **Scanlines** - CRT monitor effect overlay
5. **Text Glow** - Neon text shadows
6. **Gradient Borders** - Top border accents

---

## Implementation Tasks

### Phase 1: Foundation Setup

#### Task 1.1: Update Tailwind Config

**File:** `apps/web/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Miami Retro Palette
        primary: '#FF00FF',
        secondary: '#00FFFF',
        tertiary: '#FF9900',
        quaternary: '#FFFF00',
        'retro-bg': '#0f0c29',
        'surface-dark': '#1A1A2E',
        'neon-pink': '#FF00FF',
        'neon-blue': '#00FFFF',
        'neon-purple': '#BD00FF',
        // Keep shadcn compatibility
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... rest of shadcn colors
      },
      fontFamily: {
        display: ['Righteous', 'cursive'],
        sans: ['Inter', 'sans-serif'],
        mono: ['Orbitron', 'monospace'],
      },
      boxShadow: {
        'neon-pink': '0 0 10px #FF00FF, 0 0 20px #FF00FF',
        'neon-blue': '0 0 10px #00FFFF, 0 0 20px #00FFFF',
        'neon-purple': '0 0 10px #BD00FF, 0 0 20px #BD00FF',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'miami-gradient': 'linear-gradient(to right, #0f0c29, #302b63, #24243e)',
        'sunset-gradient': 'linear-gradient(to bottom, #FF00FF, #FF9900)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

#### Task 1.2: Add Google Fonts

**File:** `apps/web/app/layout.tsx`

```tsx
import { Righteous, Orbitron, Inter } from 'next/font/google';

const righteous = Righteous({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-mono',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});
```

#### Task 1.3: Create Global Retro Styles

**File:** `apps/web/styles/globals.css`

```css
/* Miami 80's Retro Theme */
:root {
  --neon-pink: #FF00FF;
  --neon-blue: #00FFFF;
  --neon-purple: #BD00FF;
}

body {
  background-color: #0f0c29;
  background-image: linear-gradient(to bottom, #0f0c29, #24243e);
}

/* Retro Grid Animation */
.retro-grid {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(255, 0, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
  transform: perspective(500px) rotateX(60deg) scale(2) translateY(100px);
  pointer-events: none;
  z-index: -1;
  opacity: 0.4;
  animation: grid-move 20s linear infinite;
}

@keyframes grid-move {
  0% { background-position: center 0; }
  100% { background-position: center 40px; }
}

/* Glass Card Effect */
.glass-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}

/* Neon Text Glow */
.text-glow {
  text-shadow: 0 0 5px currentColor;
}

/* Scanlines Effect */
.scanlines {
  background-image: linear-gradient(
    rgba(18, 16, 16, 0) 50%,
    rgba(0, 0, 0, 0.25) 50%
  );
  background-size: 100% 2px;
  pointer-events: none;
}
```

---

### Phase 2: Component Updates

#### Task 2.1: Retro Navigation

**File:** `apps/web/components/dashboard/nav-item.tsx`

```tsx
const NavItem = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide font-display transition-all hover:scale-105 whitespace-nowrap
      ${active
        ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-neon-pink'
        : 'text-gray-300 hover:text-white hover:bg-white/10'
      }
    `}
  >
    {label}
  </button>
);
```

#### Task 2.2: Retro Stat Cards

**File:** `apps/web/components/dashboard/stat-card.tsx`

```tsx
const StatCard = ({ title, value, color = 'neon-blue', icon }) => (
  <div className={`glass-card p-6 rounded-2xl border-t border-white/10
    hover:border-${color}/30 transition-all flex items-center justify-between`}>
    <div>
      <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-1">
        {title}
      </p>
      <h3 className="text-3xl font-display text-white text-glow">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-full bg-${color}/10 flex items-center
      justify-center text-${color} border border-${color}/20`}>
      {icon}
    </div>
  </div>
);
```

#### Task 2.3: Retro Live Feed

**File:** `apps/web/components/dashboard/live-feed.tsx`

Event types with colors:
- `info` → neon-blue
- `success` → green-400
- `warning` → tertiary (orange)
- `error` → red-500
- `tool` → neon-purple
- `thought` → quaternary (yellow)

#### Task 2.4: Retro Charts

Replace Recharts with CSS-based charts for retro aesthetic:
- Bar charts with gradient fills
- Donut chart with conic-gradient
- Animated neon glows

---

### Phase 3: Views to Port

| View | Components | Priority |
|------|------------|----------|
| Dashboard | Stat cards, bar chart, cost monitor | High |
| Live Feed | Event stream with colored icons | High |
| Token Cost | Donut chart, usage table | Medium |
| Agents | Agent cards with avatars | Medium |
| MCPs | Server list with status | Low |
| Project | Phase progress, resources | Low |

---

### Phase 4: Animations

1. **Grid Animation** - Continuous movement
2. **Pulse Effects** - Status indicators
3. **Hover Scales** - Interactive elements
4. **Glow Transitions** - Focus states
5. **Swing Animation** - Notification bell

---

## File Changes Required

### New Files
- `apps/web/styles/retro.css` - Retro-specific styles
- `apps/web/components/ui/glass-card.tsx` - Glass card component
- `apps/web/components/ui/neon-button.tsx` - Neon styled button
- `apps/web/components/charts/retro-bar-chart.tsx` - CSS bar chart
- `apps/web/components/charts/retro-donut.tsx` - CSS donut chart

### Modified Files
- `apps/web/tailwind.config.ts` - Add retro colors/fonts
- `apps/web/app/layout.tsx` - Add fonts, retro grid
- `apps/web/styles/globals.css` - Add retro utilities
- `apps/web/components/dashboard/sidebar.tsx` - Retro styling
- `apps/web/components/dashboard/header.tsx` - Retro styling
- `apps/web/components/dashboard/stat-card.tsx` - Full rewrite
- `apps/web/components/dashboard/session-list.tsx` - Retro styling
- `apps/web/components/dashboard/live-feed.tsx` - Port from source
- `apps/web/app/dashboard/page.tsx` - New layout

---

## Implementation Order

1. **Foundation** (Required first)
   - [ ] Tailwind config colors
   - [ ] Google Fonts setup
   - [ ] Global CSS utilities
   - [ ] Retro grid background

2. **Core Components**
   - [ ] Glass card component
   - [ ] Neon button variants
   - [ ] Stat cards
   - [ ] Navigation pills

3. **Dashboard Views**
   - [ ] Main dashboard layout
   - [ ] Analytics section
   - [ ] Cost monitoring
   - [ ] Live feed

4. **Charts**
   - [ ] CSS bar charts
   - [ ] Donut/pie charts
   - [ ] Progress indicators

5. **Secondary Views**
   - [ ] Token cost page
   - [ ] Sessions page
   - [ ] Settings page

---

## Success Criteria

- [ ] All colors match Miami 80's palette
- [ ] Fonts render correctly (Righteous, Orbitron, Inter)
- [ ] Glass card blur effect works
- [ ] Neon glow shadows visible
- [ ] Retro grid animates smoothly
- [ ] Dashboard matches reference design
- [ ] Dark mode by default
- [ ] Responsive on mobile

---

*Created: 2024-12-21*
*Source Reference: Google AI Studio Export*
