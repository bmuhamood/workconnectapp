'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings as SettingsIcon, Bell, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPrefs {
  email_notifications: boolean;
  email_payments: boolean;
  email_contracts: boolean;
  email_messages: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
}

export default function SettingsPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setPhone(user.phone || '');

    (async () => {
      setLoading(true);
      const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setPrefs({
          email_notifications: data.email_notifications,
          email_payments: data.email_payments,
          email_contracts: data.email_contracts,
          email_messages: data.email_messages,
          sms_notifications: data.sms_notifications,
          push_notifications: data.push_notifications,
        });
      } else {
        const { data: created } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id } as any)
          .select('*')
          .single();
        if (created) {
          setPrefs({
            email_notifications: created.email_notifications,
            email_payments: created.email_payments,
            email_contracts: created.email_contracts,
            email_messages: created.email_messages,
            sms_notifications: created.sms_notifications,
            push_notifications: created.push_notifications,
          });
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles').update({ first_name: firstName, last_name: lastName, phone }).eq('id', user.id);
      if (error) throw error;

      if (user.role === 'worker') {
        await supabase.from('worker_profiles').update({ first_name: firstName, last_name: lastName }).eq('user_id', user.id);
      } else if (user.role === 'employer') {
        await supabase.from('employer_profiles').update({ first_name: firstName, last_name: lastName }).eq('user_id', user.id);
      }

      await refreshUser();
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const togglePref = async (key: keyof NotificationPrefs) => {
    if (!user || !prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSavingPrefs(true);
    try {
      const { error } = await supabase.from('notification_preferences').update({ [key]: updated[key] } as any).eq('user_id', user.id);
      if (error) throw error;
    } catch (err: any) {
      toast.error('Failed to save preference');
      setPrefs(prefs);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (authLoading || loading || !user) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" /> Account Info</CardTitle>
          <CardDescription>{user.email} · {user.role}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-5 w-5" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {prefs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>Choose what you get notified about, and how.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              ['email_notifications', 'Email notifications (master switch)'],
              ['email_payments', 'Payment emails'],
              ['email_contracts', 'Contract emails'],
              ['email_messages', 'New message emails'],
              ['sms_notifications', 'SMS notifications'],
              ['push_notifications', 'Push notifications'],
            ] as [keyof NotificationPrefs, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="!mb-0 font-normal">{label}</Label>
                <button
                  id={key}
                  type="button"
                  role="switch"
                  aria-checked={prefs[key]}
                  disabled={savingPrefs}
                  onClick={() => togglePref(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                    prefs[key] ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prefs[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
