'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Flag, CheckCircle2, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [reportedEmail, setReportedEmail] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description.trim()) {
      toast.error('Please select a category and describe the issue');
      return;
    }

    setSubmitting(true);
    try {
      let reported_user_id: string | null = null;
      if (reportedEmail.trim()) {
        const { data } = await supabase.from('profiles').select('id').eq('email', reportedEmail.trim().toLowerCase()).maybeSingle();
        reported_user_id = data?.id ?? null;
      }

      const { error } = await supabase.from('reports').insert({
        reporter_id: user?.id ?? null,
        reported_user_id,
        category: category as any,
        description,
      } as any);
      if (error) throw error;

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </Link>

        {submitted ? (
          <Card className="border-green-200">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted</h1>
              <p className="text-gray-600 mb-6">
                Our team reviews every report. We'll follow up if we need more information.
              </p>
              <Link href="/">
                <Button>Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 mb-4">
                <Flag className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Report a Concern</h1>
              <p className="text-gray-600">
                Report harassment, fraud, safety issues, or violations of our{' '}
                <Link href="/code-of-conduct" className="text-blue-600 underline">Code of Conduct</Link>.
              </p>
            </div>

            <Alert className="mb-6 border-red-200 bg-red-50">
              <Phone className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                If you're in immediate danger, contact local emergency services first — this form is reviewed by our
                team, not monitored in real time.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
                <CardDescription>{user ? 'Submitted under your account.' : "You're not logged in — we'll still review this, but can't follow up with you directly."}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label>Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="What's this about?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="harassment">Harassment or abusive behavior</SelectItem>
                        <SelectItem value="fraud">Fraud or scam</SelectItem>
                        <SelectItem value="safety">Safety concern</SelectItem>
                        <SelectItem value="fake_profile">Fake or misleading profile</SelectItem>
                        <SelectItem value="payment_dispute">Payment dispute</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Email of person you're reporting (optional)</Label>
                    <Input type="email" value={reportedEmail} onChange={(e) => setReportedEmail(e.target.value)} placeholder="their.email@example.com" />
                  </div>
                  <div>
                    <Label>What happened? *</Label>
                    <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please include as much detail as you can — dates, what was said or done, and any relevant context." />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Flag className="h-4 w-4 mr-2" />}
                    Submit Report
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
