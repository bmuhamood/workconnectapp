'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Star, MessageSquare, FileSignature, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Applicant {
  id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  ai_match_score: number | null;
  worker: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    profession: string | null;
    city: string;
    rating_average: number;
    verification_status: string;
    profile_photo_url: string | null;
  };
}

export default function JobApplicationsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingConvo, setStartingConvo] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/login?redirect=/jobs/${jobId}/applications`);
  }, [authLoading, user, router, jobId]);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      setLoading(true);
      try {
        const { data: job } = await supabase.from('job_postings').select('title').eq('id', jobId).single();
        setJobTitle(job?.title ?? '');

        const { data, error } = await supabase
          .from('job_applications')
          .select(
            `id, status, cover_letter, applied_at, ai_match_score,
             worker_profiles ( id, user_id, first_name, last_name, profession, city, rating_average, verification_status, profile_photo_url )`
          )
          .eq('job_posting_id', jobId)
          .order('applied_at', { ascending: false });
        if (error) throw error;

        setApplicants(
          (data ?? []).map((a: any) => ({
            id: a.id,
            status: a.status,
            cover_letter: a.cover_letter,
            applied_at: a.applied_at,
            ai_match_score: a.ai_match_score,
            worker: a.worker_profiles,
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error('Failed to load applicants');
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const updateStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase.from('job_applications').update({ status } as any).eq('id', applicationId);
      if (error) throw error;
      setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
      toast.success('Application updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update application');
    }
  };

  const handleMessage = async (worker: Applicant['worker']) => {
    if (!user) return;
    setStartingConvo(worker.id);
    try {
      const [p1, p2] = [user.id, worker.user_id].sort();
      const { data: existing } = await supabase.from('conversations').select('id').eq('participant_1', p1).eq('participant_2', p2).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from('conversations').insert({ participant_1: p1, participant_2: p2 } as any);
        if (error) throw error;
      }
      router.push('/messages');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start conversation');
    } finally {
      setStartingConvo(null);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Button variant="ghost" onClick={() => router.push('/dashboard/jobs')} className="mb-4 text-gray-600">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Job Postings
      </Button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Applicants</h1>
      <p className="text-gray-500 mb-6">{jobTitle} · {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</p>

      {applicants.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-500">No one has applied to this job yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {applicants.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {a.worker.first_name[0]}{a.worker.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/workers/${a.worker.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {a.worker.first_name} {a.worker.last_name}
                      </Link>
                      <div className="text-sm text-gray-500">{a.worker.profession}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{a.worker.rating_average?.toFixed(1) ?? 'New'}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.worker.city}</span>
                        {a.worker.verification_status === 'verified' && <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>}
                        {a.ai_match_score != null && <span>{a.ai_match_score}% match</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleMessage(a.worker)} disabled={startingConvo === a.worker.id}>
                        <MessageSquare className="h-4 w-4 mr-1" /> Message
                      </Button>
                      {a.status === 'accepted' && (
                        <Link href={`/contracts/new?worker_id=${a.worker.id}`}>
                          <Button size="sm">
                            <FileSignature className="h-4 w-4 mr-1" /> Create Contract
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {a.cover_letter && (
                  <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">{a.cover_letter}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">Applied {new Date(a.applied_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
