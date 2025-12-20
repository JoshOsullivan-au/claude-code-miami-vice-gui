'use client';

import dynamic from 'next/dynamic';

// Dynamically import Sidebar with no SSR to avoid hydration issues
const Sidebar = dynamic(
  () => import('@/components/dashboard/sidebar').then((mod) => mod.Sidebar),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
