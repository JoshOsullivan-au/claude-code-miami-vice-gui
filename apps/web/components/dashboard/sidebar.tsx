'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  History,
  Settings,
  Telescope,
  Coins,
  Bot,
  Server,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sessions', href: '/dashboard/sessions', icon: History },
  { name: 'Live Feed', href: '/dashboard/live', icon: Activity },
  { name: 'Token Costs', href: '/dashboard/costs', icon: Coins },
  { name: 'Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'MCPs', href: '/dashboard/mcps', icon: Server },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering active states after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-full w-64 flex-col glass-card border-r border-white/10">
      {/* Logo Section */}
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div className="relative">
          <Telescope className="h-8 w-8 text-neon-pink" />
          <div className="absolute inset-0 blur-md bg-neon-pink/30 -z-10" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-lg tracking-wide text-white text-glow">
            OBSERVATORY
          </span>
          <span className="text-[10px] text-neon-blue font-mono uppercase tracking-widest">
            Claude Code
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4 custom-scrollbar overflow-y-auto">
        {navigation.map((item) => {
          // Only check active state after mount to prevent hydration mismatch
          const isActive = mounted && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-neon-pink'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 hover:pl-5'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 transition-all',
                isActive ? 'text-white' : 'text-gray-500'
              )} />
              <span className={cn(
                isActive ? 'font-display tracking-wide' : ''
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status Section */}
      <div className="border-t border-white/10 p-4">
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="status-dot-online" />
            <span className="text-xs text-gray-400 font-mono uppercase">System Online</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono">
            v0.1.0 · Miami Edition
          </div>
        </div>
      </div>
    </div>
  );
}
