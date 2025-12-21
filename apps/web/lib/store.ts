import { create } from 'zustand';
import type { Session, Execution, AnalyticsSummary } from './api';

interface ObservatoryState {
  // Active session
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;

  // Real-time executions
  recentExecutions: Execution[];
  addExecution: (execution: Execution) => void;
  clearExecutions: () => void;

  // Analytics cache
  analyticsSummary: AnalyticsSummary | null;
  setAnalyticsSummary: (summary: AnalyticsSummary) => void;

  // UI state
  selectedPeriod: '7d' | '30d' | 'all';
  setSelectedPeriod: (period: '7d' | '30d' | 'all') => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Demo mode for screenshots
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
}

export const useObservatoryStore = create<ObservatoryState>((set) => ({
  // Active session
  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  // Real-time executions
  recentExecutions: [],
  addExecution: (execution) =>
    set((state) => ({
      recentExecutions: [execution, ...state.recentExecutions].slice(0, 100),
    })),
  clearExecutions: () => set({ recentExecutions: [] }),

  // Analytics cache
  analyticsSummary: null,
  setAnalyticsSummary: (summary) => set({ analyticsSummary: summary }),

  // UI state
  selectedPeriod: '7d',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Demo mode for screenshots
  demoMode: false,
  setDemoMode: (enabled) => set({ demoMode: enabled }),
}));
