'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/dashboard/header';
import { Server, Database, Globe, Key, Terminal, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface McpServer {
  name: string;
  type: 'local' | 'remote';
  command?: string;
  args?: string[];
  url?: string;
  hasEnv: boolean;
  envKeys: string[];
  status: 'configured' | 'unknown';
}

interface McpResponse {
  servers: McpServer[];
  configPath: string | null;
  error?: string;
}

export default function MCPsPage() {
  const [data, setData] = useState<McpResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMcps = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/mcps');
      if (!res.ok) throw new Error('Failed to fetch MCPs');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load MCPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMcps();
  }, []);

  const localServers = data?.servers.filter(s => s.type === 'local') || [];
  const remoteServers = data?.servers.filter(s => s.type === 'remote') || [];

  return (
    <div className="flex flex-col h-full">
      <Header title="MCP Servers" />
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Total Servers</p>
                <p className="text-2xl font-display text-white mt-1">{data?.servers.length || 0}</p>
              </div>
              <Server className="h-8 w-8 text-neon-blue opacity-60" />
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Local</p>
                <p className="text-2xl font-display text-neon-purple mt-1">{localServers.length}</p>
              </div>
              <Database className="h-8 w-8 text-neon-purple opacity-60" />
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Remote</p>
                <p className="text-2xl font-display text-neon-pink mt-1">{remoteServers.length}</p>
              </div>
              <Globe className="h-8 w-8 text-neon-pink opacity-60" />
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">With API Keys</p>
                <p className="text-2xl font-display text-neon-green mt-1">
                  {data?.servers.filter(s => s.hasEnv).length || 0}
                </p>
              </div>
              <Key className="h-8 w-8 text-neon-green opacity-60" />
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-mono text-gray-500">
            Config: {data?.configPath || 'Not found'}
          </p>
          <button
            onClick={fetchMcps}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="glass-card rounded-xl p-4 mb-6 border border-red-500/30">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Local Servers */}
        {localServers.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg text-white tracking-wide mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-neon-purple" />
              LOCAL SERVERS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localServers.map((server) => (
                <ServerCard key={server.name} server={server} />
              ))}
            </div>
          </div>
        )}

        {/* Remote Servers */}
        {remoteServers.length > 0 && (
          <div>
            <h2 className="font-display text-lg text-white tracking-wide mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-neon-pink" />
              REMOTE SERVERS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {remoteServers.map((server) => (
                <ServerCard key={server.name} server={server} />
              ))}
            </div>
          </div>
        )}

        {!loading && data?.servers.length === 0 && (
          <div className="glass-card-hover rounded-2xl p-12 text-center">
            <Server className="h-16 w-16 mx-auto text-neon-blue mb-6 opacity-50" />
            <h2 className="font-display text-2xl text-white tracking-wide mb-4">
              NO MCP SERVERS CONFIGURED
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Add MCP servers to your Claude Code configuration at ~/.claude/mcp.json
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServerCard({ server }: { server: McpServer }) {
  const isRemote = server.type === 'remote';

  return (
    <div className="glass-card-hover rounded-xl p-4 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {isRemote ? (
            <Globe className="h-5 w-5 text-neon-pink" />
          ) : (
            <Terminal className="h-5 w-5 text-neon-purple" />
          )}
          <h3 className="font-display text-white tracking-wide">{server.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-neon-green" />
          <span className="text-xs text-neon-green font-mono">configured</span>
        </div>
      </div>

      {server.command && (
        <div className="mb-3">
          <p className="text-xs font-mono text-gray-500 mb-1">Command</p>
          <code className="text-xs text-gray-300 bg-black/30 px-2 py-1 rounded block truncate">
            {server.command} {server.args?.join(' ')}
          </code>
        </div>
      )}

      {server.url && (
        <div className="mb-3">
          <p className="text-xs font-mono text-gray-500 mb-1">URL</p>
          <a
            href={server.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neon-blue hover:text-neon-blue/80 flex items-center gap-1 truncate"
          >
            {new URL(server.url).hostname}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>
      )}

      {server.hasEnv && (
        <div>
          <p className="text-xs font-mono text-gray-500 mb-1">Environment</p>
          <div className="flex flex-wrap gap-1">
            {server.envKeys.map((key) => (
              <span
                key={key}
                className="text-xs bg-neon-green/10 text-neon-green px-2 py-0.5 rounded font-mono"
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
