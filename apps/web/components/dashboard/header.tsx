'use client';

import { Button } from '@/components/ui/button';
import { useObservatoryStore } from '@/lib/store';
import { RefreshCw, Bell, Zap, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const { wsConnected } = useObservatoryStore();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 px-6 glass-card">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-display text-white tracking-wide text-glow">
          {title.toUpperCase()}
        </h1>
        <div className="hidden md:flex items-center gap-2 ml-4">
          <span className="text-xs text-gray-500 font-mono uppercase">Mode:</span>
          <span className="text-xs text-neon-blue font-mono uppercase">MONITORING</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 border border-white/10">
          <Clock className="h-4 w-4 text-neon-blue" />
          <span className="text-sm font-mono text-neon-blue tabular-nums">
            {currentTime}
          </span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 border border-white/10">
          <Zap className={`h-4 w-4 ${wsConnected ? 'text-green-400' : 'text-red-400'}`} />
          <div className={wsConnected ? 'status-dot-online' : 'status-dot-offline'} />
          <span className={`text-xs font-mono uppercase ${
            wsConnected ? 'text-green-400' : 'text-red-400'
          }`}>
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Action Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-white/5 text-gray-400 hover:text-neon-blue transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-white/5 text-gray-400 hover:text-neon-pink transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
