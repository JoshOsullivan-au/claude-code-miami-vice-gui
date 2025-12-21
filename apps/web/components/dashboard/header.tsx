'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, Bell, FileText, Clock, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useObservatoryStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const { demoMode, setDemoMode } = useObservatoryStore();

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

  // Fetch events count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/events/stats');
        if (res.ok) {
          const data = await res.json();
          setEventsCount(data.total);
        }
      } catch {
        setEventsCount(null);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
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
          <span className="text-xs text-neon-blue font-mono uppercase">FILE CAPTURE</span>
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

        {/* Events Count */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 border border-white/10">
          <FileText className="h-4 w-4 text-neon-pink" />
          <span className="text-xs font-mono uppercase text-neon-pink">
            {eventsCount !== null ? `${eventsCount} EVENTS` : 'LOADING...'}
          </span>
        </div>

        {/* Action Buttons */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-white/5 text-gray-400 hover:text-neon-blue transition-colors"
        >
          <Bell className="h-5 w-5" />
          {eventsCount !== null && eventsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
          )}
        </Button>

        {/* Demo Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'hover:bg-white/5 transition-colors',
            demoMode ? 'text-neon-pink' : 'text-gray-400 hover:text-neon-pink'
          )}
          onClick={() => setDemoMode(!demoMode)}
          title={demoMode ? 'Demo mode ON' : 'Demo mode OFF'}
        >
          {demoMode ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-white/5 text-gray-400 hover:text-neon-pink transition-colors"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
