'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, HeartPulse, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase/client';
import type { PatientLanguage } from '@/lib/i18n/patient-language';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', dateOfBirth: '', gender: '', address: '', district: '', region: '', emergencyName: '', emergencyPhone: '', language: 'en' as PatientLanguage });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { window.localStorage.setItem('ruralcare-patient-language', form.language); }, [form.language]);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(null); setNotice(null);
    const { data, error: signupError } = await supabaseClient.auth.signUp({
      email: form.email.trim(), password: form.password,
      options: { data: { full_name: form.fullName.trim(), phone: form.phone.trim(), date_of_birth: form.dateOfBirth || null, gender: form.gender || null, address: form.address.trim() || null, district: form.district.trim() || null, region: form.region.trim() || null, emergency_contact_name: form.emergencyName.trim() || null, emergency_contact_phone: form.emergencyPhone.trim() || null, role: 'patient', language: form.language } },
    });
    if (signupError || !data.user) { setError(signupError?.message ?? 'Unable to create your account.'); setLoading(false); return; }
    if (!data.session) { setNotice('Account created. Check your email to confirm it, then sign in.'); setLoading(false); return; }
    router.replace('/dashboard');
  };

  const field = (label: string, key: keyof typeof form, type = 'text', required = false) => <label className="space-y-1.5 text-sm"><span className="font-medium text-foreground">{label}</span><input required={required} type={type} value={String(form[key])} onChange={(event) => update(key, event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>;

  return <main className="min-h-screen bg-background px-4 py-8"><div className="mx-auto max-w-2xl"><div className="mb-6 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary"><HeartPulse className="h-6 w-6 text-primary-foreground" /></div><div><h1 className="text-xl font-bold text-foreground">Create patient account</h1><p className="text-sm text-muted-foreground">Your details will be connected to your private patient profile.</p></div></div><form onSubmit={submit} className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">{error && <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4" />{error}</div>}{notice && <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">{notice}</div>}<div className="grid gap-4 sm:grid-cols-2">{field('Full name', 'fullName', 'text', true)}{field('Phone', 'phone', 'tel', true)}{field('Email', 'email', 'email', true)}{field('Password', 'password', 'password', true)}{field('Date of birth', 'dateOfBirth', 'date')}<label className="space-y-1.5 text-sm"><span className="font-medium text-foreground">Gender</span><select value={form.gender} onChange={(event) => update('gender', event.target.value)} className="select-field"><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>{field('Address', 'address')}{field('District', 'district')}{field('Region', 'region')}{field('Emergency contact name', 'emergencyName')}{field('Emergency contact phone', 'emergencyPhone')}<label className="space-y-1.5 text-sm"><span className="font-medium text-foreground">Language</span><select value={form.language} onChange={(event) => update('language', event.target.value as PatientLanguage)} className="select-field"><option value="en">English</option><option value="mr">Marathi</option><option value="hi">Hindi</option></select></label></div><button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Create account</button><p className="text-center text-sm text-muted-foreground">Already registered? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p></form></div></main>;
}