'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, Loader2, Plus, Search, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isHealthcareStaff } from '@/lib/auth/roles';
import { supabaseClient } from '@/lib/supabase/client';
import type { Facility, Patient, Referral } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ReferralStatus = Exclude<Referral['status'], null>;
type ReferralPriority = Exclude<Referral['priority'], null>;
type FormState = { patientId: string; destinationId: string; reason: string; priority: ReferralPriority };
const emptyForm: FormState = { patientId: '', destinationId: '', reason: '', priority: 'routine' };
const statuses: { value: ReferralStatus; label: string }[] = [
  { value: 'created', label: 'Created' }, { value: 'patient_notified', label: 'Patient notified' },
  { value: 'in_progress', label: 'In progress' }, { value: 'arrived', label: 'Arrived' },
  { value: 'completed', label: 'Completed' }, { value: 'missed', label: 'Missed' }, { value: 'cancelled', label: 'Cancelled' },
];
const priorities: { value: ReferralPriority; label: string }[] = [
  { value: 'routine', label: 'Routine' }, { value: 'urgent', label: 'Urgent' }, { value: 'emergency', label: 'Emergency' },
];

function dateLabel(value: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function statusClass(status: string | null) {
  if (status === 'completed') return 'border-success/30 bg-success/10 text-success';
  if (status === 'cancelled' || status === 'missed') return 'border-destructive/25 bg-destructive/5 text-destructive';
  if (status === 'emergency') return 'border-warning/40 bg-warning/10 text-warning-foreground';
  return 'border-primary/20 bg-primary/5 text-primary';
}

export default function ReferralsPage() {
  const { user, role } = useAuth();
  const canManage = isHealthcareStaff(role);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadData = async () => {
    setLoading(true); setError(null);
    const [referralResult, patientResult, facilityResult] = await Promise.all([
      supabaseClient.from('referrals').select('*').order('referral_date', { ascending: false }),
      supabaseClient.from('patients').select('*').order('full_name', { ascending: true }),
      supabaseClient.from('facilities').select('*').order('name', { ascending: true }),
    ]);
    if (referralResult.error || patientResult.error) setError(referralResult.error?.message ?? patientResult.error?.message ?? 'Unable to load referrals.');
    else { setReferrals((referralResult.data ?? []) as Referral[]); setPatients((patientResult.data ?? []) as Patient[]); setFacilities(facilityResult.error ? [] : (facilityResult.data ?? []) as Facility[]); }
    setLoading(false);
  };
  useEffect(() => { if (user) void loadData(); }, [user]);

  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.full_name])), [patients]);
  const facilityNames = useMemo(() => new Map(facilities.map((facility) => [facility.id, facility.name])), [facilities]);
  const filtered = useMemo(() => referrals.filter((referral) => {
    const query = search.trim().toLowerCase();
    return !query || patientNames.get(referral.patient_id)?.toLowerCase().includes(query) || referral.reason.toLowerCase().includes(query);
  }), [patientNames, referrals, search]);

  const saveReferral = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canManage) return;
    const patient = patients.find((item) => item.id === form.patientId);
    if (!patient || !form.destinationId || !form.reason.trim()) { setFormError('Select a patient, destination, and referral reason.'); return; }
    if (patient.facility_id === form.destinationId) { setFormError('Destination facility must differ from the source facility.'); return; }
    setSaving(true); setFormError(null); setNotice(null);
    const { error: saveError } = await supabaseClient.from('referrals').insert({ patient_id: patient.id, source_facility_id: patient.facility_id, destination_facility_id: form.destinationId, referred_by: user.id, reason: form.reason.trim(), priority: form.priority, status: 'created', referral_date: new Date().toISOString() });
    if (saveError) setFormError(saveError.message);
    else { setNotice('Referral created successfully.'); setForm(emptyForm); setFormOpen(false); await loadData(); }
    setSaving(false);
  };

  const changeStatus = async (referral: Referral, status: ReferralStatus) => {
    if (!canManage) return;
    const update = status === 'completed' ? { status, completed_at: new Date().toISOString() } : { status };
    const { error: updateError } = await supabaseClient.from('referrals').update(update).eq('id', referral.id);
    if (updateError) setError(updateError.message); else { setNotice(`Referral marked ${statuses.find((item) => item.value === status)?.label.toLowerCase()}.`); await loadData(); }
  };

  return <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Care coordination</p><h1 className="text-3xl font-bold tracking-tight text-foreground">Closed-Loop Referrals</h1><p className="mt-2 text-sm text-muted-foreground">Track referrals from creation through receiving-facility completion.</p></div>{canManage && <Button type="button" onClick={() => { setFormOpen(true); setFormError(null); }}><Plus className="mr-2 h-4 w-4" />New Referral</Button>}</div>
    {notice && <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
    {!canManage && <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />You have read-only referral access.</div>}
    {formOpen && canManage && <Card><CardHeader><CardTitle>New referral</CardTitle><CardDescription>Create a referral from the patient&apos;s assigned facility.</CardDescription></CardHeader><form onSubmit={saveReferral}><CardContent className="space-y-4">{formError && <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{formError}</p>}<div><Label htmlFor="referral-patient">Patient</Label><select id="referral-patient" required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })} className="select-field"><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}</select></div><div><Label htmlFor="referral-destination">Destination facility</Label><select id="referral-destination" required value={form.destinationId} onChange={(event) => setForm({ ...form, destinationId: event.target.value })} className="select-field"><option value="">Select destination</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></div><div><Label htmlFor="referral-priority">Priority</Label><select id="referral-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as ReferralPriority })} className="select-field">{priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}</select></div><div><Label htmlFor="referral-reason">Reason</Label><textarea id="referral-reason" required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save referral</Button></div></CardContent></form></Card>}
    <Card><CardContent className="p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or reason" /></div></CardContent></Card>
    {error && <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}<Button type="button" variant="outline" size="sm" onClick={() => void loadData()}>Try again</Button></div>}
    <div><h2 className="text-lg font-semibold text-foreground">Referral list</h2><p className="text-sm text-muted-foreground">{loading ? 'Loading records...' : `${filtered.length} referral${filtered.length === 1 ? '' : 's'} shown`}</p></div>
    {!loading && !error && <div className="space-y-4">{filtered.map((referral) => <Card key={referral.id}><CardContent className="space-y-4 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-foreground">{patientNames.get(referral.patient_id) ?? 'Patient record unavailable'}</h3><p className="mt-1 text-sm text-muted-foreground">Created {dateLabel(referral.referral_date)}</p></div><span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(referral.status)}`}>{statuses.find((status) => status.value === referral.status)?.label ?? 'Not recorded'}</span></div><div className="grid gap-3 border-t border-border/70 pt-4 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">From:</span> {facilityNames.get(referral.source_facility_id ?? '') ?? 'Not assigned'}</p><p><span className="text-muted-foreground">To:</span> {facilityNames.get(referral.destination_facility_id ?? '') ?? 'Not assigned'}</p><p><span className="text-muted-foreground">Priority:</span> {priorities.find((priority) => priority.value === referral.priority)?.label ?? 'Not recorded'}</p><p><span className="text-muted-foreground">Reason:</span> {referral.reason}</p></div>{canManage && <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">{(['patient_notified', 'in_progress', 'arrived', 'completed', 'cancelled'] as ReferralStatus[]).map((status) => <Button key={status} type="button" variant="outline" size="sm" disabled={referral.status === status} onClick={() => void changeStatus(referral, status)}>{statuses.find((option) => option.value === status)?.label}</Button>)}</div>}</CardContent></Card>)}</div>}
  </div>;
}
