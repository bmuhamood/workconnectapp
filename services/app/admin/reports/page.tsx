'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Flag } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [contactMsgs, setContactMsgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: reps }, { data: contacts }] = await Promise.all([
      supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(first_name,last_name,email), reported:profiles!reports_reported_user_id_fkey(first_name,last_name,email)')
        .order('created_at', { ascending: false }),
      supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setReports(reps ?? []);
    setContactMsgs(contacts ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status, admin_notes: notes[id] || null, resolved_by: user?.id, resolved_at: status !== 'open' ? new Date().toISOString() : null } as any)
        .eq('id', id);
      if (error) throw error;
      toast.success('Report updated');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update report');
    }
  };

  const filtered = reports.filter((r) => (tab === 'all' ? true : r.status === tab));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="open">Open ({reports.filter((r) => r.status === 'open').length})</TabsTrigger>
          <TabsTrigger value="investigating">Investigating</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="contact">Contact Form ({contactMsgs.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'contact' ? (
        loading ? (
          <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
        ) : contactMsgs.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-gray-500">No contact form submissions yet.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {contactMsgs.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900">{m.subject}</div>
                    <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{m.message}</p>
                  <p className="text-sm text-gray-500">From: {m.name} ({m.email}){m.phone ? ` · ${m.phone}` : ''}{m.user_type ? ` · ${m.user_type}` : ''}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : loading ? (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-500">No reports here.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-red-500" />
                    <Badge variant="outline" className="capitalize">{r.category.replace('_', ' ')}</Badge>
                    <Badge className={r.status === 'open' ? 'bg-red-100 text-red-800' : r.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{r.status}</Badge>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-800 mb-3">{r.description}</p>
                <div className="text-sm text-gray-500 mb-3">
                  Reported by: {r.reporter ? `${r.reporter.first_name} ${r.reporter.last_name} (${r.reporter.email})` : 'Anonymous'}
                  {r.reported && <> · About: {r.reported.first_name} {r.reported.last_name} ({r.reported.email})</>}
                </div>
                {r.status === 'open' || r.status === 'investigating' ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Admin notes (optional)"
                      value={notes[r.id] ?? r.admin_notes ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      {r.status === 'open' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'investigating')}>Start Investigating</Button>
                      )}
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(r.id, 'resolved')}>Mark Resolved</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, 'dismissed')}>Dismiss</Button>
                    </div>
                  </div>
                ) : r.admin_notes ? (
                  <p className="text-sm text-gray-500 italic">Admin notes: {r.admin_notes}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
