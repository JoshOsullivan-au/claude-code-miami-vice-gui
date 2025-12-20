'use client';

import { Header } from '@/components/dashboard/header';
import { Server, Database, Globe } from 'lucide-react';

export default function MCPsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="MCP Servers" />
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="glass-card-hover rounded-2xl p-12 text-center">
          <Server className="h-16 w-16 mx-auto text-neon-blue mb-6 opacity-50" />
          <h2 className="font-display text-2xl text-white tracking-wide mb-4">
            MCP SERVER MONITORING
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Monitor Model Context Protocol servers, their status, and usage.
            This feature is coming soon.
          </p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto text-neon-purple mb-2" />
              <p className="text-xs font-mono text-gray-500 uppercase">Local Servers</p>
            </div>
            <div className="text-center">
              <Globe className="h-8 w-8 mx-auto text-neon-pink mb-2" />
              <p className="text-xs font-mono text-gray-500 uppercase">Remote Servers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
