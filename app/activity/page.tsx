'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Briefcase, FileSignature, Wallet, Bell, Activity as ActivityIcon } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'application' | 'contract' | 'payment' | 'notification';
  title: string;
  detail: string;
  date: string;
}

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/activity');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const feed: ActivityItem[] = [];

      if (user.role === 'worker') {
        const { data: workerProfile } = await supabase.from('worker_profiles').select('id').eq('user_id', user.id).maybeSingle();
        if (workerProfile) {
          const [{ data: applications }, { data: contracts }, { data: payments }] = await Promise.all([
            supabase.from('job_applications').select('id, status, applied_at, job_postings(title)').eq('worker_id', workerProfile.id).order('applied_at', { ascending: false }).limit(20),
            supabase.from('contracts').select('id, job_title, status, updated_at').eq('worker_id', workerProfile.id).order('updated_at', { ascending: false }).limit(20),
            supabase.from('worker_payments').select('id, net_amount, status, created_at').eq('worker_id', workerProfile.id).order('created_at', { ascending: false }).limit(20),
          ]);
          (applications ?? []).forEach((a: any) => feed.push({ id: `app-${a.id}`, type: 'application', title: `Applied to ${a.job_postings?.title ?? 'a job'}`, detail: `Status: ${a.status}`, date: a.applied_at }));
          (contracts ?? []).forEach((c: any) => feed.push({ id: `con-${c.id}`, type: 'contract', title: c.job_title, detail: `Status: ${c.status}`, date: c.updated_at }));
          (payments ?? []).forEach((p: any) => feed.push({ id: `pay-${p.id}`, type: 'payment', title: `Payment ${p.status}`, detail: new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(p.net_amount), date: p.created_at }));
        }
      } else if (user.role === 'employer') {
        const { data: employerProfile } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle();
        if (employerProfile) {
          const [{ data: postings }, { data: contracts }, { data: invoices }] = await Promise.all([
            supabase.from('job_postings').select('id, title, status, updated_at').eq('employer_id', employerProfile.id).order('updated_at', { ascending: false }).limit(20),
            supabase.from('contracts').select('id, job_title, status, updated_at').eq('employer_id', employerProfile.id).order('updated_at', { ascending: false }).limit(20),
            supabase.from('employer_invoices').select('id, invoice_number, status, updated_at, total_amount').eq('employer_id', employerProfile.id).order('updated_at', { ascending: false }).limit(20),
          ]);
          (postings ?? []).forEach((p: any) => feed.push({ id: `job-${p.id}`, type: 'application', title: p.title, detail: `Status: ${p.status}`, date: p.updated_at }));
          (contracts ?? []).forEach((c: any) => feed.push({ id: `con-${c.id}`, type: 'contract', title: c.job_title, detail: `Status: ${c.status}`, date: c.updated_at }));
          (invoices ?? []).forEach((i: any) => feed.push({ id: `inv-${i.id}`, type: 'payment', title: `Invoice ${i.invoice_number}`, detail: `${i.status} — ${new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(i.total_amount)}`, date: i.updated_at }));
        }
      }

      const { data: notifications } = await supabase.from('notifications').select('id, title, message, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      (notifications ?? []).forEach((n: any) => feed.push({ id: `notif-${n.id}`, type: 'notification', title: n.title, detail: n.message, date: n.created_at }));

      feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(feed.slice(0, 50));
      setLoading(false);
    })();
  }, [user]);

  const iconFor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'application': return <Briefcase className="h-4 w-4 text-blue-600" />;
      case 'contract': return <FileSignature className="h-4 w-4 text-purple-600" />;
      case 'payment': return <Wallet className="h-4 w-4 text-green-600" />;
      default: return <Bell className="h-4 w-4 text-amber-600" />;
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <ActivityIcon className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-500">No activity yet — this fills up as you apply, sign contracts, and get paid.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="mt-0.5">{iconFor(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.detail}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{new Date(item.date).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
