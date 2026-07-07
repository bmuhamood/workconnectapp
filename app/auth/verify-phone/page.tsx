// app/auth/verify-phone/page.tsx
//
// Renamed in spirit, not in URL: registration now confirms by email link
// (Supabase Auth default) rather than SMS OTP, so this route is now a
// "check your email" screen with a resend button. Old links to
// /auth/verify-phone?email=...&phone=... still land here gracefully.
//
// Want SMS OTP back? Enable Phone as an auth provider in the Supabase
// dashboard and wire up a matching input flow — see the README's
// "Phone verification note".
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error('No email address found — please register again.');
      return;
    }
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResent(true);
      toast.success('Confirmation email resent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend confirmation email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            {email ? (
              <>We sent a confirmation link to <strong>{email}</strong>.</>
            ) : (
              'We sent you a confirmation link.'
            )}{' '}
            Click it to activate your account, then log in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resent && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Confirmation email resent — check your inbox (and spam folder).</AlertDescription>
            </Alert>
          )}
          <Button className="w-full" variant="outline" onClick={handleResend} disabled={isResending || !email}>
            {isResending ? 'Resending...' : 'Resend confirmation email'}
          </Button>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
