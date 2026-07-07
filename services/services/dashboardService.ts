// services/dashboardService.ts
import { supabase } from '@/lib/supabase/client';

export const fetchDashboardData = async (userRole: 'worker' | 'employer' | 'admin' | 'super_admin') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw error;

  const data: any = { user: profile };

  if (userRole === 'worker') {
    const { data: workerProfile } = await supabase.from('worker_profiles').select('*').eq('user_id', user.id).maybeSingle();
    data.workerProfile = workerProfile;
  } else if (userRole === 'employer') {
    const { data: employerProfile } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle();
    data.employerProfile = employerProfile;
  }
  // Admin/super_admin metrics live in components/dashboard/SuperAdminDashboard.tsx,
  // which queries Supabase directly (aggregate counts across all tables).

  return data;
};
