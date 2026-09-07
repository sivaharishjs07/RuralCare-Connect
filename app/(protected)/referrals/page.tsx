'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ChevronDown,
  Filter,
  Hospital,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isHealthcareStaff } from '@/lib/auth/roles';
import { supabaseClient } from '@/lib/supabase/client';
import type { Facility, Patient, Profile, Referral, ReferralEvent } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ReferralStatus = Exclude<Referral['status'], null>;
type ReferralPriority = Exclude<Referral['priority'], null>;
type StatusFilter = 'all' | ReferralStatus;

type ReferralForm = {
  patientId: string;
  destinationFacilityId: string;
  reason: string;
  diagnosis: string;
  priority: ReferralPriority;
};

const emptyForm: ReferralForm = { patientId: '', destinationFacilityId: '', reason: '', diagnosis: '', priority: 'standard' };
const statusOptions: { value: ReferralStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
const priorityOptions: { value: ReferralPriority; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
];

function labelFor(options: { value: string; label: string }[], value: string | null) {
  return options.find((option) => option.value === value)?.label ?? 'Not recorded';
}

function statusClasses(status: string | null) {
  if (status === 'completed') return 'border-success/30 bg-success/10 text-success';
  if (status === 'cancelled') return 'border-destructive/25 bg-destructive/5 text-destructive';
  if (status === 'arrived') return 'border-accent/30 bg-accent/10 text-accent';
  if (status === 'in_progress') return 'border-secondary/30 bg-secondary/10 text-secondary';
  return 'border-primary/20 bg-primary/5 text-primary';
}

function formatDate(value: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function eventLabel(eventType: string | null) {
  return eventType?.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Unspecified event';
}

function ReferralTimeline({ events, loading, error, recordedByNames }: { events: ReferralEvent[]; loading: boolean; error: string | null; recordedByNames: Map<string, string> }) {
  if (loading) return <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-3 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Loading referral timeline...</div>;
  if (error) return <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-3 text-xs text-warning-foreground" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />Unable to load timeline events: {error}</div>;
  if (events.length === 0) return <p className="rounded-md bg-muted/40 px-3 py-3 text-xs text-muted-foreground">No timeline events are available for this referral.</p>;
  return <ol className="relative ml-2 border-l border-border/80 pl-5">{events.map((event) => <li key={event.id} className="relative pb-4 last:pb-0"><span className="absolute -left-[1.34rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" /><p className="text-xs font-semibold text-foreground">{eventLabel(event.event_type)}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(event.created_at)}{event.recorded_by ? ` · ${recordedByNames.get(event.recorded_by) ?? 'Recorder unavailable'}` : ''}</p>{event.description && <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>}</li>)}</ol>;
}

function ReferralForm({ patients, facilities, form, saving, error, onChange, onSubmit, onCancel }: { patients: Patient[]; facilities: Facility[]; form: ReferralForm; saving: boolean; error: string | null; onChange: (field: keyof ReferralForm, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const patient = patients.find((item) => item.id === form.patientId);
  const sourceFacility = facilities.find((facility) => facility.id === patient?.facility_id);
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-border/70"><div><CardTitle className="text-lg">New referral</CardTitle><CardDescription className="mt-1">Create a referral from the patient&apos;s assigned facility.</CardDescription></div><Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Close referral form"><X className="h-4 w-4" /></Button></CardHeader>
      <form onSubmit={onSubmit}><CardContent className="space-y-5 pt-6">
        {error && <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
        <div className="space-y-2"><Label htmlFor="referral-patient">Patient <span className="text-destructive">*</span></Label><select id="referral-patient" required value={form.patientId} onChange={(event) => onChange('patientId', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option value="">Select an existing patient</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select></div>
        <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-sm"><span className="font-medium text-foreground">Source facility: </span><span className="text-muted-foreground">{sourceFacility?.name ?? (patient ? 'Patient has no assigned facility' : 'Selected patient facility will appear here')}</span></div>
        <div className="space-y-2"><Label htmlFor="referral-destination">Destination facility <span className="text-destructive">*</span></Label><select id="referral-destination" required value={form.destinationFacilityId} onChange={(event) => onChange('destinationFacilityId', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option value="">Select destination facility</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="referral-priority">Priority</Label><select id="referral-priority" value={form.priority} onChange={(event) => onChange('priority', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">{priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="referral-diagnosis">Diagnosis, if recorded</Label><Input id="referral-diagnosis" value={form.diagnosis} onChange={(event) => onChange('diagnosis', event.target.value)} /></div></div>
        <div className="space-y-2"><Label htmlFor="referral-reason">Referral reason / details <span className="text-destructive">*</span></Label><textarea id="referral-reason" required value={form.reason} onChange={(event) => onChange('reason', event.target.value)} rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Record why the referral is being made" /></div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create referral</Button></div>
      </CardContent></form>
    </Card>
  );
}

function ReferralCard({ referral, patientName, sourceName, destinationName, canManage, updating, onStatusChange }: { referral: Referral; patientName: string; sourceName: string; destinationName: string; canManage: boolean; updating: boolean; onStatusChange: (referral: Referral, status: ReferralStatus) => void }) {
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [recordedByNames, setRecordedByNames] = useState(new Map<string, string>());

  const loadEvents = async () => {
    setEventsLoading(true);
    setEventsError(null);
    const eventResult = await supabaseClient.from('referral_events').select('*').eq('referral_id', referral.id).order('created_at', { ascending: true });
    if (eventResult.error) {
      setEventsError(eventResult.error.message);
      setEvents([]);
      setRecordedByNames(new Map());
    } else {
      const loadedEvents = (eventResult.data ?? []) as ReferralEvent[];
      setEvents(loadedEvents);
      const recorderIds = Array.from(new Set(loadedEvents.map((event) => event.recorded_by).filter((id): id is string => Boolean(id))));
      if (recorderIds.length > 0) {
        const recorderResult = await supabaseClient.from('profiles').select('id, full_name').in('id', recorderIds);
        setRecordedByNames(recorderResult.error ? new Map() : new Map(((recorderResult.data ?? []) as Pick<Profile, 'id' | 'full_name'>[]).map((profile) => [profile.id, profile.full_name])));
      } else {
        setRecordedByNames(new Map());
      }
    }
    setEventsLoading(false);
  };

  const toggleTimeline = () => {
    const nextOpen = !timelineOpen;
    setTimelineOpen(nextOpen);
    if (nextOpen) void loadEvents();
  };

  return <Card className="transition-shadow hover:shadow-md"><CardContent className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-foreground">{patientName}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Created {formatDate(referral.referred_at)}</p></div><span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(referral.status)}`}>{labelFor(statusOptions, referral.status)}</span></div><div className="mt-5 grid gap-4 border-t border-border/70 pt-4 text-sm sm:grid-cols-2"><div className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><strong className="font-medium text-foreground">From:</strong> {sourceName}</span></div><div className="flex items-start gap-2 text-muted-foreground"><Hospital className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><strong className="font-medium text-foreground">To:</strong> {destinationName}</span></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reason</p><p className="mt-1 text-foreground">{referral.reason}</p></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Priority</p><p className="mt-1 text-foreground">{labelFor(priorityOptions, referral.priority)}</p></div></div><div className="mt-4 grid gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:grid-cols-3"><span>Arrived: {formatDate(referral.arrived_at)}</span><span>Completed: {formatDate(referral.completed_at)}</span><span>Updated: {formatDate(referral.updated_at)}</span></div><div className="mt-4 border-t border-border/70 pt-4"><button type="button" onClick={toggleTimeline} className="flex w-full items-center justify-between text-left text-sm font-semibold text-foreground hover:text-primary" aria-expanded={timelineOpen}><span>Referral timeline</span><ChevronDown className={`h-4 w-4 transition-transform ${timelineOpen ? 'rotate-180' : ''}`} /></button>{timelineOpen && <div className="mt-4"><ReferralTimeline events={events} loading={eventsLoading} error={eventsError} recordedByNames={recordedByNames} /></div>}</div>{canManage && <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4"><span className="mr-1 self-center text-xs font-medium text-muted-foreground">Update status:</span>{statusOptions.filter((option) => option.value !== referral.status).map((option) => <Button key={option.value} type="button" variant="outline" size="sm" disabled={updating} onClick={() => onStatusChange(referral, option.value)}>{updating && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}{option.label}</Button>)}</div>}</CardContent></Card>;
}

export default function ReferralsPage() {
  const { user, role } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [form, setForm] = useState<ReferralForm>(emptyForm);
  const canManage = isHealthcareStaff(role);

  const loadData = async () => {
    setLoading(true); setError(null);
    const [referralResult, patientResult, facilityResult] = await Promise.all([
      supabaseClient.from('referrals').select('*').order('referred_at', { ascending: false }),
      supabaseClient.from('patients').select('*').order('full_name', { ascending: true }),
      supabaseClient.from('facilities').select('*').order('name', { ascending: true }),
    ]);
    const coreFailure = referralResult.error ?? patientResult.error;
    if (coreFailure) {
      setError(coreFailure.message);
    } else {
      setReferrals((referralResult.data ?? []) as Referral[]); setPatients((patientResult.data ?? []) as Patient[]); setFacilities(facilityResult.error ? [] : (facilityResult.data ?? []) as Facility[]);
    }
    setLoading(false);
  };
  useEffect(() => { if (user) void loadData(); }, [user]);

  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.full_name])), [patients]);
  const facilityNames = useMemo(() => new Map(facilities.map((facility) => [facility.id, facility.name])), [facilities]);
  const filteredReferrals = useMemo(() => referrals.filter((referral) => { const query = search.trim().toLowerCase(); const patientName = patientNames.get(referral.patient_id) ?? ''; return (!query || patientName.toLowerCase().includes(query) || referral.reason.toLowerCase().includes(query)) && (statusFilter === 'all' || referral.status === statusFilter) && (destinationFilter === 'all' || referral.to_facility_id === destinationFilter) && (!dateFilter || referral.referred_at.slice(0, 10) === dateFilter); }), [dateFilter, destinationFilter, patientNames, referrals, search, statusFilter]);
  const updateField = (field: keyof ReferralForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); setDestinationFilter('all'); setDateFilter(''); };

  const saveReferral = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!user || !canManage) return; setSaving(true); setFormError(null); setNotice(null);
    const patient = patients.find((item) => item.id === form.patientId);
    if (!patient || !form.destinationFacilityId || !form.reason.trim()) { setFormError('Select a patient and destination facility, and enter a referral reason.'); setSaving(false); return; }
    if (!patient.facility_id) { setFormError('This patient has no assigned source facility. Assign a facility on the patient record before creating a referral.'); setSaving(false); return; }
    if (patient.facility_id === form.destinationFacilityId) { setFormError('Destination facility must differ from the source facility.'); setSaving(false); return; }
    const { error: saveError } = await supabaseClient.from('referrals').insert({ patient_id: patient.id, from_facility_id: patient.facility_id, to_facility_id: form.destinationFacilityId, created_by: user.id, reason: form.reason.trim(), diagnosis: form.diagnosis.trim() || null, priority: form.priority, status: 'pending', referred_at: new Date().toISOString() } as never);
    if (saveError) setFormError(saveError.message); else { setNotice('Referral created successfully.'); setForm(emptyForm); setFormOpen(false); await loadData(); }
    setSaving(false);
  };

  const changeStatus = async (referral: Referral, status: ReferralStatus) => {
    if (!canManage) return; setUpdatingId(referral.id); setNotice(null); setError(null);
    const update: Record<string, string> = { status };
    if (status === 'arrived') update.arrived_at = new Date().toISOString();
    if (status === 'completed') { update.completed_at = new Date().toISOString(); if (!referral.arrived_at) update.arrived_at = new Date().toISOString(); }
    const { error: updateError } = await supabaseClient.from('referrals').update(update as never).eq('id', referral.id);
    if (updateError) setError(`Unable to update referral status: ${updateError.message}`); else { setNotice(`Referral marked ${labelFor(statusOptions, status).toLowerCase()}.`); await loadData(); }
    setUpdatingId(null);
  };

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Care coordination</p><h1 className="text-3xl font-bold tracking-tight text-foreground">Closed-Loop Referrals</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Track referrals from creation through receiving-facility arrival and completion.</p></div>{canManage && <Button type="button" onClick={() => { setFormError(null); setNotice(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Referral</Button>}</div>
    {notice && <div className="mb-6 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success" role="status"><CheckCircle2 className="h-4 w-4" />{notice}</div>}{!canManage && <div className="mb-6 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />You have read-only referral access. Existing Supabase RLS policies remain the final authority.</div>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]"><section className="min-w-0 space-y-5"><Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or reason" className="pl-9" aria-label="Search referrals" /></div><div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Filter referrals by status"><option value="all">All statuses</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><select value={destinationFilter} onChange={(event) => setDestinationFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Filter by destination facility"><option value="all">All destinations</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select><div className="flex gap-2"><Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter referrals by date" /><Button type="button" variant="ghost" size="icon" onClick={resetFilters} aria-label="Clear referral filters"><X className="h-4 w-4" /></Button></div></CardContent></Card>
    {error && <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Unable to load referrals</p><p className="mt-1">{error}</p><Button type="button" variant="outline" size="sm" onClick={() => void loadData()} className="mt-3">Try again</Button></div></div>}<div><h2 className="text-lg font-semibold text-foreground">Referral list</h2><p className="text-sm text-muted-foreground">{loading ? 'Loading records...' : `${filteredReferrals.length} referral${filteredReferrals.length === 1 ? '' : 's'} shown`}</p></div>{loading && !error && <div className="flex min-h-48 items-center justify-center rounded-lg border border-border/70 bg-card"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2 text-sm text-muted-foreground">Loading referrals...</span></div>}{!loading && !error && filteredReferrals.length === 0 && <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center"><ClipboardList className="h-8 w-8 text-muted-foreground/60" /><h3 className="mt-3 font-semibold text-foreground">No referrals found</h3><p className="mt-1 text-sm text-muted-foreground">{search || dateFilter || statusFilter !== 'all' || destinationFilter !== 'all' ? 'Try clearing or changing the filters.' : canManage ? 'Create a referral to begin tracking a patient journey.' : 'Referrals available to your account will appear here.'}</p></div>}{!loading && !error && filteredReferrals.length > 0 && <div className="space-y-4">{filteredReferrals.map((referral) => <ReferralCard key={referral.id} referral={referral} patientName={patientNames.get(referral.patient_id) ?? 'Patient record unavailable'} sourceName={facilityNames.get(referral.from_facility_id) ?? 'Source facility unavailable'} destinationName={facilityNames.get(referral.to_facility_id) ?? 'Destination facility unavailable'} canManage={canManage} updating={updatingId === referral.id} onStatusChange={changeStatus} />)}</div>}</section><aside>{formOpen && canManage && <ReferralForm patients={patients} facilities={facilities} form={form} saving={saving} error={formError} onChange={updateField} onSubmit={saveReferral} onCancel={() => { if (!saving) { setFormOpen(false); setFormError(null); } }} />}{!formOpen && canManage && <Card className="hidden border-dashed border-border/80 bg-card/50 lg:block"><CardContent className="flex flex-col items-center px-6 py-10 text-center"><ArrowRight className="h-8 w-8 text-primary/70" /><h2 className="mt-4 font-semibold text-foreground">Start a referral</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Every referral remains visible until its receiving and completion status is recorded.</p><Button type="button" variant="outline" onClick={() => setFormOpen(true)} className="mt-5"><Plus className="mr-2 h-4 w-4" />New Referral</Button></CardContent></Card>}</aside></div></div>;
}