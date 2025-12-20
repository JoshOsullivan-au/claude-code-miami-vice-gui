'use client';

import { Header } from '@/components/dashboard/header';
import { LiveFeed } from '@/components/dashboard/live-feed';

export default function LivePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Live Feed" />
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <LiveFeed />
      </div>
    </div>
  );
}
