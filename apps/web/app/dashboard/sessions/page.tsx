'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/dashboard/header';
import { SessionList } from '@/components/dashboard/session-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useState } from 'react';

export default function SessionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', statusFilter],
    queryFn: () =>
      api.getSessions({
        limit: 50,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Sessions" />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading sessions...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Showing {sessions?.sessions.length || 0} of {sessions?.total || 0} sessions
            </p>
            <SessionList sessions={sessions?.sessions || []} />
          </>
        )}
      </div>
    </div>
  );
}
