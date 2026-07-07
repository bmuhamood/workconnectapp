// lib/supabase/authService.ts
//
// Replaces lib/api.ts's `authService` (Django/axios) with Supabase Auth.
// Throws an axios-shaped error ({ response: { data: {...} } }) so existing
// page components' try/catch blocks (written for axios) don't need to change.
import { supabase } from './client';
import type { UserRole } from './database.types';

function asAxiosError(message: string, field = 'non_field_errors') {
  const err: any = new Error(message);
  err.response = { data: { [field]: [message] } };
  return err;
}

export interface RegisterWorkerInput {
  email: string;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  city: string;
  district?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  bio?: string | null;
  profession: string;
  experience_years?: number;
  education_level?: string;
  languages?: string[];
  additional_skills?: string;
  hourly_rate?: number;
  availability?: string;
  expected_salary_min?: number | null;
  expected_salary_max?: number | null;
}

export interface RegisterEmployerInput {
  email: string;
  phone: string;
  password: string;
  first_name: string;
  last_name: string;
  city: string;
  address?: string;
  company_name?: string;
}

export async function registerWorker(data: RegisterWorkerInput) {
  const { email, phone, password, first_name, last_name, ...profileFields } = data;

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone,
        first_name,
        last_name,
        role: 'worker' as UserRole,
        registration_method: 'email',
      },
    },
  });

  if (error) throw asAxiosError(error.message, 'email');
  const userId = signUpData.user?.id;
  if (!userId) throw asAxiosError('Sign up did not return a user. Check your email to confirm your account.');

  // The `on_auth_user_created` trigger creates public.profiles automatically.
  // Now create the role-specific profile row with the rest of the fields.
  const { error: profileError } = await supabase.from('worker_profiles').insert({
    user_id: userId,
    first_name,
    last_name,
    ...profileFields,
  } as any);

  if (profileError) throw asAxiosError(profileError.message);

  return { user_id: userId, email, phone, role: 'worker' as const };
}

export async function registerEmployer(data: RegisterEmployerInput) {
  const { email, phone, password, first_name, last_name, ...profileFields } = data;

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone,
        first_name,
        last_name,
        role: 'employer' as UserRole,
        registration_method: 'email',
      },
    },
  });

  if (error) throw asAxiosError(error.message, 'email');
  const userId = signUpData.user?.id;
  if (!userId) throw asAxiosError('Sign up did not return a user. Check your email to confirm your account.');

  const { error: profileError } = await supabase.from('employer_profiles').insert({
    user_id: userId,
    first_name,
    last_name,
    ...profileFields,
  } as any);

  if (profileError) throw asAxiosError(profileError.message);

  return { user_id: userId, email, phone, role: 'employer' as const };
}

export async function loginWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw asAxiosError(error.message, 'non_field_errors');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw asAxiosError(profileError.message);

  if (profile.is_blacklisted) {
    await supabase.auth.signOut();
    throw asAxiosError(
      'This account has been permanently blacklisted. Contact bbosa2009@gmail.com if you believe this is a mistake.',
      'non_field_errors'
    );
  }
  if (profile.is_blocked) {
    await supabase.auth.signOut();
    throw asAxiosError(
      (profile.blocked_reason ? `Account suspended: ${profile.blocked_reason}` : 'Your account has been suspended.') +
        ' Contact bbosa2009@gmail.com for help.',
      'non_field_errors'
    );
  }

  return { user: profile, session: data.session };
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw asAxiosError(error.message);
}

export async function getCurrentProfile() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  return profile;
}
