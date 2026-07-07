'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import { Loader2 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const { data, loading, refreshData } = useDashboard();

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="p-6">
      <SuperAdminDashboard user={user} data={data || { metrics: {} }} onRefresh={refreshData} />
    </div>
  );
}
