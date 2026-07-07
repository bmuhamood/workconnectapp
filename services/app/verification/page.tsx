'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function VerificationRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login?redirect=/verification');
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      router.push('/admin/verifications');
    } else {
      // Worker document verification lives in the dashboard's Documents tab.
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );
}
