'use client';

import { Header } from '@/components/dashboard/header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Header title="Settings" />

          <div className="flex-1 overflow-auto p-6 space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure the connection to the Observatory API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">API URL</label>
                  <input
                    type="text"
                    defaultValue="http://localhost:3001"
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The URL where the Observatory API is running
                  </p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium">WebSocket URL</label>
                  <input
                    type="text"
                    defaultValue="ws://localhost:3001/ws"
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    WebSocket connection for real-time updates
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Claude Code Hooks</CardTitle>
                <CardDescription>
                  Instructions for setting up Claude Code hooks to capture session data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add the following to your Claude Code settings to enable data capture:
                </p>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`// ~/.claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": ".*",
        "command": "{ curl -X POST http://localhost:3001/api/hook -H 'Content-Type: application/json' -d '{\\"type\\":\\"execution_completed\\",\\"tool\\":\\"$TOOL_NAME\\"}' ; } ; exit 0"
      }
    ]
  }
}`}
                </pre>
                <Button variant="outline" size="sm">
                  Copy Configuration
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Manage your Observatory data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Export Data</p>
                    <p className="text-xs text-muted-foreground">
                      Download all session data as JSON
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Clear Data</p>
                    <p className="text-xs text-muted-foreground">
                      Delete all session and execution data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
