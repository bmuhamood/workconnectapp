// lib/supabase/client.ts
// Browser-side Supabase client for use in Client Components ('use client').
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

// Convenience singleton for simple client-side usage (hooks, etc.)
export const supabase = createClient();
