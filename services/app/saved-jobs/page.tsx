'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSavedJobs } from '@/hooks/useSavedJobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bookmark, MapPin, Briefcase, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SavedJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { fetchSavedJobs, toggleSaveJob } = useSavedJobs();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/saved-jobs');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchSavedJobs();
        setItems(data);
      } catch {
        toast.error('Failed to load saved jobs');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, fetchSavedJobs]);

  const handleRemove = async (jobPostingId: string) => {
    await toggleSaveJob(jobPostingId);
    setItems((prev) => prev.filter((i) => i.job_postings?.id !== jobPostingId));
    toast.success('Removed from saved jobs');
  };

  const formatUGX = (amount: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">My Saved Jobs</h1>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bookmark className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">You haven't saved any jobs yet.</p>
            <Link href="/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const job = item.job_postings;
            if (!job) return null;
            const employer = job.employer_profiles;
            return (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      <Link href={`/jobs/${job.id}`} className="hover:text-blue-600">
                        {job.title}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {employer?.company_name || `${employer?.first_name ?? ''} ${employer?.last_name ?? ''}`.trim()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(job.id)} title="Remove from saved">
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{formatUGX(job.salary_min)} - {formatUGX(job.salary_max)}</span>
                    <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
                  </div>
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
