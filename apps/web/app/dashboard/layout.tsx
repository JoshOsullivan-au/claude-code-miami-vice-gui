'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen" suppressHydrationWarning>
      {mounted ? (
        <Sidebar />
      ) : (
        <div className="w-64 flex-shrink-0" />
      )}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
