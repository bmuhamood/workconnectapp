'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface DocRow {
  id: string;
  worker_id: string;
  document_type: string;
  document_file_url: string;
  status: string;
  uploaded_at: string;
  worker_profiles: { first_name: string; last_name: string; user_id: string } | null;
}

export default function AdminVerificationsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('worker_documents')
      .select('*, worker_profiles(first_name, last_name, user_id)')
      .order('uploaded_at', { ascending: false });
    setDocs((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDecision = async (doc: DocRow, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('worker_documents')
        .update({ status, verified_by: user?.id, verified_at: new Date().toISOString() } as any)
        .eq('id', doc.id);
      if (error) throw error;

      // Also flip the worker's overall verification_status once their
      // national_id is approved — mirrors the "verified" badge shown site-wide.
      if (status === 'verified' && doc.document_type === 'national_id') {
        await supabase.from('worker_profiles').update({ verification_status: 'verified' } as any).eq('id', doc.worker_id);
      }

      toast.success(`Document ${status}`);
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status } : d)));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update document');
    }
  };

  const filtered = docs.filter((d) => (tab === 'all' ? true : d.status === tab));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Document Verifications</h1>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Pending ({docs.filter((d) => d.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-500">Nothing here.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {doc.worker_profiles?.first_name} {doc.worker_profiles?.last_name} — <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                    </p>
                    <p className="text-sm text-gray-500">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className="capitalize">{doc.status}</Badge>
                  <a href={doc.document_file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">View</Button>
                  </a>
                  {doc.status === 'pending' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleDecision(doc, 'verified')}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDecision(doc, 'rejected')}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
