'use client';

import { useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Button } from '@/components/ui/button';
import { Copy, Check, Settings2, Webhook, Database, Trash2, Download, FileCode } from 'lucide-react';

const hookConfig = `{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/observatory.sh",
            "timeout": 1
          }
        ]
      }
    ]
  }
}`;

const hookScript = `#!/bin/bash
# Observatory - Simple file-based capture (no server required)
mkdir -p ~/.claude-observatory
cat >> ~/.claude-observatory/events.jsonl`;

const eventsPath = '~/.claude-observatory/events.jsonl';

export default function SettingsPage() {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(hookConfig);
      setCopiedConfig(true);
      const timeout = setTimeout(() => setCopiedConfig(false), 2000);
      return () => clearTimeout(timeout);
    } catch (error) {
      console.error('Failed to copy config:', error);
    }
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(hookScript);
      setCopiedScript(true);
      const timeout = setTimeout(() => setCopiedScript(false), 2000);
      return () => clearTimeout(timeout);
    } catch (error) {
      console.error('Failed to copy script:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Header title="Settings" />

          <div className="flex-1 overflow-auto p-6 space-y-6 max-w-3xl custom-scrollbar">
            {/* Data Location */}
            <div className="glass-card-hover rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings2 className="h-5 w-5 text-neon-blue" />
                <div>
                  <h3 className="font-display text-lg text-white tracking-wide">
                    DATA LOCATION
                  </h3>
                  <p className="text-xs font-mono text-gray-500 uppercase mt-1">
                    File-based Capture
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-wide">
                    Events File
                  </label>
                  <input
                    type="text"
                    defaultValue={eventsPath}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white font-mono text-sm focus:border-neon-blue/50 focus:outline-none"
                    readOnly
                  />
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-400">
                    <strong>No server required for capture.</strong> Events are appended to a local file. Dashboard reads on refresh.
                  </p>
                </div>
              </div>
            </div>

            {/* Claude Code Hooks */}
            <div className="glass-card-hover rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Webhook className="h-5 w-5 text-neon-pink" />
                <div>
                  <h3 className="font-display text-lg text-white tracking-wide">
                    CLAUDE CODE HOOKS
                  </h3>
                  <p className="text-xs font-mono text-gray-500 uppercase mt-1">
                    Enable Data Capture
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-4">
                <strong>Step 1:</strong> Add this to your Claude Code settings:
              </p>

              <div className="relative mb-6">
                <div className="absolute top-3 left-4 text-xs font-mono text-gray-500">
                  ~/.claude/settings.json
                </div>
                <pre className="bg-black/50 border border-white/10 rounded-xl p-4 pt-10 text-xs font-mono text-neon-blue overflow-x-auto custom-scrollbar">
                  {hookConfig}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyConfig}
                  className="absolute top-3 right-3 text-gray-400 hover:text-neon-pink"
                >
                  {copiedConfig ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="text-sm text-gray-400 mb-4">
                <strong>Step 2:</strong> Create the hook script in your project:
              </p>

              <div className="relative">
                <div className="absolute top-3 left-4 text-xs font-mono text-gray-500 flex items-center gap-2">
                  <FileCode className="h-3 w-3" />
                  .claude/hooks/observatory.sh
                </div>
                <pre className="bg-black/50 border border-white/10 rounded-xl p-4 pt-10 text-xs font-mono text-green-400 overflow-x-auto custom-scrollbar">
                  {hookScript}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyScript}
                  className="absolute top-3 right-3 text-gray-400 hover:text-neon-pink"
                >
                  {copiedScript ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
                <p className="text-xs text-gray-300">
                  <span className="text-neon-purple font-bold">Setup:</span> Run <code className="text-neon-blue">chmod +x .claude/hooks/observatory.sh</code> to make it executable.
                  That&apos;s it! Events are captured instantly with zero latency.
                </p>
              </div>
            </div>

            {/* Data Management */}
            <div className="glass-card-hover rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Database className="h-5 w-5 text-neon-orange" />
                <div>
                  <h3 className="font-display text-lg text-white tracking-wide">
                    DATA MANAGEMENT
                  </h3>
                  <p className="text-xs font-mono text-gray-500 uppercase mt-1">
                    Export & Clear
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">Export Data</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Download all session data as JSON
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 opacity-50 cursor-not-allowed" disabled title="Coming soon">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">Clear Data</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Delete all session and execution data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" className="gap-2 opacity-50 cursor-not-allowed" disabled title="Coming soon">
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
