'use client';

import { Header } from '@/components/dashboard/header';
import { Bot, Cpu, Zap } from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Agents" />
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="glass-card-hover rounded-2xl p-12 text-center">
          <Bot className="h-16 w-16 mx-auto text-neon-purple mb-6 opacity-50" />
          <h2 className="font-display text-2xl text-white tracking-wide mb-4">
            AGENT MONITORING
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Track deployed agents, their executions, and resource usage.
            This feature is coming soon.
          </p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <Cpu className="h-8 w-8 mx-auto text-neon-blue mb-2" />
              <p className="text-xs font-mono text-gray-500 uppercase">Background Tasks</p>
            </div>
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto text-neon-orange mb-2" />
              <p className="text-xs font-mono text-gray-500 uppercase">Live Agents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
