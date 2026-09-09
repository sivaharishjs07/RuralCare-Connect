'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Loader2, Plus, Search, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isHealthcareStaff } from '@/lib/auth/roles';
import { supabaseClient } from '@/lib/supabase/client';
import type { FollowUp, Patient, Profile, Referral } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FollowUpStatus = Exclude<FollowUp['status'], null>;
type FormState = { patientId: string; referralId: string; workerId: string; date: string; status: FollowUpStatus; notes: string };
const emptyForm: FormState = { patientId: '', referralId: '', workerId: '', date: '', status: 'scheduled', notes: '' };
const statuses: { value: FollowUpStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' }, { value: 'completed', label: 'Completed' },
  { value: 'missed', label: 'Missed' }, { value: 'cancelled', label: 'Cancelled' },
];

function dateLabel(value: string | null) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function statusClass(status: string | null) {
  if (status === 'completed') return 'border-success/30 bg-success/10 text-success';
  if (status === 'missed' || status === 'cancelled') return 'border-destructive/25 bg-destructive/5 text-destructive';
  return 'border-primary/20 bg-primary/5 text-primary';
}

export default function FollowUpsPage() {
  const { user, role } = useAuth();
  const canManage = isHealthcareStaff(role);
  const [items, setItems] = useState<FollowUp[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [workers, setWorkers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [followUpResult, patientResult, referralResult, workerResult] = await Promise.all([
      supabaseClient.from('follow_ups').select('*').order('follow_up_date', { ascending: true }),
      supabaseClient.from('patients').select('*').order('full_name', { ascending: true }),
      supabaseClient.from('referrals').select('*').order('referral_date', { ascending: false }),
      supabaseClient.from('profiles').select('*').in('role', ['health_worker', 'doctor', 'admin']).order('full_name', { ascending: true }),
    ]);
    if (followUpResult.error || patientResult.error) setError(followUpResult.error?.message ?? patientResult.error?.message ?? 'Unable to load follow-ups.');
    else {
      setItems((followUpResult.data ?? []) as FollowUp[]);
      setPatients((patientResult.data ?? []) as Patient[]);
      setReferrals(referralResult.error ? [] : (referralResult.data ?? []) as Referral[]);
      setWorkers(workerResult.error ? [] : (workerResult.data ?? []) as Profile[]);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) void loadData(); }, [user]);

  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.full_name])), [patients]);
  const workerNames = useMemo(() => new Map(workers.map((worker) => [worker.id, worker.full_name])), [workers]);
  const filteredItems = useMemo(() => items.filter((item) => {
    const query = search.trim().toLowerCase();
    const patientName = patientNames.get(item.patient_id) ?? '';
    return (!query || patientName.toLowerCase().includes(query) || item.notes?.toLowerCase().includes(query)) && (!dateFilter || item.follow_up_date === dateFilter);
  }), [dateFilter, items, patientNames, search]);

  const saveFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canManage) return;
    if (!form.patientId || !form.date) { setFormError('Select a patient and follow-up date.'); return; }
    setSaving(true); setFormError(null); setNotice(null);
    const { error: saveError } = await supabaseClient.from('follow_ups').insert({ patient_id: form.patientId, referral_id: form.referralId || null, health_worker_id: form.workerId || null, follow_up_date: form.date, status: form.status, notes: form.notes.trim() || null });
    if (saveError) setFormError(saveError.message);
    else { setNotice('Follow-up created successfully.'); setForm(emptyForm); setFormOpen(false); await loadData(); }
    setSaving(false);
  };

  const changeStatus = async (item: FollowUp, status: FollowUpStatus) => {
    if (!canManage) return;
    const { error: updateError } = await supabaseClient.from('follow_ups').update({ status }).eq('id', item.id);
    if (updateError) setError(updateError.message);
    else { setNotice(`Follow-up marked ${status.replaceAll('_', ' ')}.`); await loadData(); }
  };

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Continuity of care</p><h1 className="text-3xl font-bold tracking-tight text-foreground">Follow-Up Care</h1><p className="mt-2 text-sm text-muted-foreground">Plan and track follow-up care after healthcare interactions.</p></div>{canManage && <Button type="button" onClick={() => { setFormOpen(true); setFormError(null); }}><Plus className="mr-2 h-4 w-4" />New Follow-Up</Button>}</div>
    {notice && <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
    {!canManage && <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />You have read-only follow-up access.</div>}
    {formOpen && canManage && <Card><CardHeader><CardTitle>New follow-up</CardTitle><CardDescription>Plan continuity of care using existing records.</CardDescription></CardHeader><form onSubmit={saveFollowUp}><CardContent className="space-y-4">{formError && <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{formError}</p>}<div><Label htmlFor="follow-patient">Patient</Label><select id="follow-patient" required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })} className="select-field"><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="follow-date">Follow-up date</Label><Input id="follow-date" required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div><div><Label htmlFor="follow-worker">Assigned worker</Label><select id="follow-worker" value={form.workerId} onChange={(event) => setForm({ ...form, workerId: event.target.value })} className="select-field"><option value="">Not assigned</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.full_name}</option>)}</select></div></div><div><Label htmlFor="follow-referral">Related referral</Label><select id="follow-referral" value={form.referralId} onChange={(event) => setForm({ ...form, referralId: event.target.value })} className="select-field"><option value="">None</option>{referrals.filter((item) => item.patient_id === form.patientId).map((item) => <option key={item.id} value={item.id}>{item.reason.slice(0, 60)}</option>)}</select></div><div><Label htmlFor="follow-notes">Notes</Label><textarea id="follow-notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save follow-up</Button></div></CardContent></form></Card>}
    <Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or notes" /></div><Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter by date" /></CardContent></Card>
    {error && <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}<Button type="button" variant="outline" size="sm" onClick={() => void loadData()}>Try again</Button></div>}
    <div><h2 className="text-lg font-semibold text-foreground">Follow-up list</h2><p className="text-sm text-muted-foreground">{loading ? 'Loading records...' : `${filteredItems.length} follow-up${filteredItems.length === 1 ? '' : 's'} shown`}</p></div>
    {!loading && !error && <div className="space-y-4">{filteredItems.map((item) => <Card key={item.id}><CardContent className="space-y-4 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-foreground">{patientNames.get(item.patient_id) ?? 'Patient record unavailable'}</h3><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />{dateLabel(item.follow_up_date)}</p></div><span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{statuses.find((status) => status.value === item.status)?.label ?? 'Not recorded'}</span></div><div className="border-t border-border/70 pt-4 text-sm text-muted-foreground">{item.health_worker_id ? workerNames.get(item.health_worker_id) ?? 'Worker unavailable' : 'Not assigned'} · {item.notes || 'No notes recorded'}</div>{canManage && <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">{(['completed', 'missed', 'cancelled'] as FollowUpStatus[]).map((status) => <Button key={status} type="button" variant="outline" size="sm" disabled={item.status === status} onClick={() => void changeStatus(item, status)}>{statuses.find((option) => option.value === status)?.label}</Button>)}</div>}</CardContent></Card>)}</div>}
  </div>;
}
