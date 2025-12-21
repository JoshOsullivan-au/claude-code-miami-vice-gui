import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// MCP config file locations (in order of priority)
const MCP_CONFIG_PATHS = [
  join(homedir(), '.claude', 'mcp.json'),
  join(homedir(), '.config', 'claude', 'mcp.json'),
];

interface McpServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export interface McpServer {
  name: string;
  type: 'local' | 'remote';
  command?: string;
  args?: string[];
  url?: string;
  hasEnv: boolean;
  envKeys: string[];
  status: 'configured' | 'unknown';
}

function findConfigPath(): string | null {
  for (const path of MCP_CONFIG_PATHS) {
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}

function maskEnvValue(key: string, value: string): string {
  // Mask sensitive values, show only last 4 characters
  if (value.length <= 8) {
    return '****';
  }
  return '****' + value.slice(-4);
}

export function getMcpServers(): {
  servers: McpServer[];
  configPath: string | null;
  error?: string;
} {
  const configPath = findConfigPath();

  if (!configPath) {
    return {
      servers: [],
      configPath: null,
      error: 'No MCP configuration file found',
    };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config: McpConfig = JSON.parse(content);

    const servers: McpServer[] = [];

    for (const [name, serverConfig] of Object.entries(config.mcpServers || {})) {
      const isRemote = !!serverConfig.url;
      const envKeys = serverConfig.env ? Object.keys(serverConfig.env) : [];

      servers.push({
        name,
        type: isRemote ? 'remote' : 'local',
        command: serverConfig.command,
        args: serverConfig.args,
        url: serverConfig.url,
        hasEnv: envKeys.length > 0,
        envKeys,
        status: 'configured',
      });
    }

    // Sort: local first, then remote, alphabetically within each group
    servers.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'local' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      servers,
      configPath,
    };
  } catch (error) {
    return {
      servers: [],
      configPath,
      error: error instanceof Error ? error.message : 'Failed to parse MCP config',
    };
  }
}

export function getMcpServerDetails(name: string): {
  found: boolean;
  server?: McpServer & { envMasked?: Record<string, string> };
  error?: string;
} {
  const configPath = findConfigPath();

  if (!configPath) {
    return { found: false, error: 'No MCP configuration file found' };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config: McpConfig = JSON.parse(content);

    const serverConfig = config.mcpServers?.[name];
    if (!serverConfig) {
      return { found: false, error: `Server "${name}" not found` };
    }

    const isRemote = !!serverConfig.url;
    const envKeys = serverConfig.env ? Object.keys(serverConfig.env) : [];

    // Mask environment values for security
    const envMasked: Record<string, string> = {};
    if (serverConfig.env) {
      for (const [key, value] of Object.entries(serverConfig.env)) {
        envMasked[key] = maskEnvValue(key, value);
      }
    }

    return {
      found: true,
      server: {
        name,
        type: isRemote ? 'remote' : 'local',
        command: serverConfig.command,
        args: serverConfig.args,
        url: serverConfig.url,
        hasEnv: envKeys.length > 0,
        envKeys,
        status: 'configured',
        envMasked,
      },
    };
  } catch (error) {
    return {
      found: false,
      error: error instanceof Error ? error.message : 'Failed to parse MCP config',
    };
  }
}

export function getMcpStats(): {
  total: number;
  local: number;
  remote: number;
  withEnv: number;
  configPath: string | null;
} {
  const { servers, configPath } = getMcpServers();

  return {
    total: servers.length,
    local: servers.filter(s => s.type === 'local').length,
    remote: servers.filter(s => s.type === 'remote').length,
    withEnv: servers.filter(s => s.hasEnv).length,
    configPath,
  };
}
