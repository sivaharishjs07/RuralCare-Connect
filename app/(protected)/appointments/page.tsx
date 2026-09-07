'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Filter,
  Loader2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isHealthcareStaff } from '@/lib/auth/roles';
import { supabaseClient } from '@/lib/supabase/client';
import type { Appointment, Facility, Patient, Profile } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AppointmentStatus = Exclude<Appointment['status'], null>;
type StatusFilter = 'all' | AppointmentStatus;

type AppointmentForm = {
  patientId: string;
  doctorId: string;
  facilityId: string;
  scheduledTime: string;
  status: AppointmentStatus;
  queueNumber: string;
  reason: string;
};

const emptyForm: AppointmentForm = {
  patientId: '',
  doctorId: '',
  facilityId: '',
  scheduledTime: '',
  status: 'scheduled',
  queueNumber: '',
  reason: '',
};

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'in_consultation', label: 'In Consultation' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'Missed' },
];

function statusLabel(status: string | null) {
  return statusOptions.find((option) => option.value === status)?.label ?? 'Not recorded';
}

function statusClasses(status: string | null) {
  switch (status) {
    case 'completed': return 'border-success/30 bg-success/10 text-success';
    case 'cancelled':
    case 'no_show': return 'border-destructive/25 bg-destructive/5 text-destructive';
    case 'checked_in': return 'border-accent/30 bg-accent/10 text-accent';
    case 'in_consultation': return 'border-secondary/30 bg-secondary/10 text-secondary';
    default: return 'border-primary/20 bg-primary/5 text-primary';
  }
}

function formatDateTime(value: string | null) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function dateKey(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
}

function formatDateInput(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function AppointmentForm({
  patients,
  doctors,
  facilities,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onCancel,
}: {
  patients: Patient[];
  doctors: Profile[];
  facilities: Facility[];
  form: AppointmentForm;
  saving: boolean;
  error: string | null;
  onChange: (field: keyof AppointmentForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-border/70">
        <div>
          <CardTitle className="text-lg">New appointment</CardTitle>
          <CardDescription className="mt-1">Schedule a visit using existing care records.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Close appointment form"><X className="h-4 w-4" /></Button>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-5 pt-6">
          {error && <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          <div className="space-y-2"><Label htmlFor="appointment-patient">Patient <span className="text-destructive">*</span></Label><select id="appointment-patient" required value={form.patientId} onChange={(event) => onChange('patientId', event.target.value)} className="select-field"><option value="">Select an existing patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}</select></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="appointment-doctor">Doctor</Label><select id="appointment-doctor" value={form.doctorId} onChange={(event) => onChange('doctorId', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option value="">Not assigned</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="appointment-facility">Facility</Label><select id="appointment-facility" value={form.facilityId} onChange={(event) => onChange('facilityId', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option value="">Not assigned</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="appointment-time">Date and time <span className="text-destructive">*</span></Label><Input id="appointment-time" required type="datetime-local" value={form.scheduledTime} onChange={(event) => onChange('scheduledTime', event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="appointment-status">Status</Label><select id="appointment-status" value={form.status} onChange={(event) => onChange('status', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="appointment-queue">Queue number</Label><Input id="appointment-queue" type="number" min="1" step="1" value={form.queueNumber} onChange={(event) => onChange('queueNumber', event.target.value)} placeholder="Optional" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="appointment-reason">Notes / reason</Label><textarea id="appointment-reason" value={form.reason} onChange={(event) => onChange('reason', event.target.value)} rows={3} className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Add the appointment reason or notes" /></div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create appointment</Button></div>
        </CardContent>
      </form>
    </Card>
  );
}

function AppointmentCard({ appointment, patientName, doctorName, facilityName, canManage, updating, onStatusChange }: { appointment: Appointment; patientName: string; doctorName: string; facilityName: string; canManage: boolean; updating: boolean; onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></div><div className="min-w-0"><h3 className="truncate font-semibold text-foreground">{patientName}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{formatDateTime(appointment.scheduled_time)}</p></div></div>
          <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(appointment.status)}`}>{statusLabel(appointment.status)}</span>
        </div>
        <div className="mt-5 grid gap-3 border-t border-border/70 pt-4 text-sm sm:grid-cols-2"><div className="flex items-start gap-2 text-muted-foreground"><Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{doctorName}</span></div><div className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{facilityName}</span></div><div className="flex items-start gap-2 text-muted-foreground"><span className="flex h-4 min-w-4 items-center justify-center rounded bg-muted px-1 text-[10px] font-bold text-foreground">{appointment.queue_number ?? '—'}</span><span>Queue number</span></div><div className="flex items-start gap-2 text-muted-foreground"><FileTextIcon /><span>{appointment.reason || 'No notes or reason recorded'}</span></div></div>
        {canManage && <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4"><span className="mr-1 self-center text-xs font-medium text-muted-foreground">Update status:</span>{(['checked_in', 'completed', 'cancelled', 'no_show'] as AppointmentStatus[]).map((status) => <Button key={status} type="button" variant="outline" size="sm" disabled={updating || appointment.status === status} onClick={() => onStatusChange(appointment, status)}>{updating && appointment.status !== status && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}{statusLabel(status)}</Button>)}</div>}
      </CardContent>
    </Card>
  );
}

function FileTextIcon() { return <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary/30 text-[9px] text-primary">i</span>; }

export default function AppointmentsPage() {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
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
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const canManage = isHealthcareStaff(role);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [appointmentResult, patientResult, doctorResult, facilityResult] = await Promise.all([
      supabaseClient.from('appointments').select('*').order('scheduled_time', { ascending: true }),
      supabaseClient.from('patients').select('*').order('full_name', { ascending: true }),
      supabaseClient.from('profiles').select('*').eq('role', 'doctor').order('full_name', { ascending: true }),
      supabaseClient.from('facilities').select('*').order('name', { ascending: true }),
    ]);
    const coreFailure = appointmentResult.error ?? patientResult.error;
    if (coreFailure) {
      setError(coreFailure.message);
    } else {
      setAppointments((appointmentResult.data ?? []) as Appointment[]);
      setPatients((patientResult.data ?? []) as Patient[]);
      setDoctors(doctorResult.error ? [] : (doctorResult.data ?? []) as Profile[]);
      setFacilities(facilityResult.error ? [] : (facilityResult.data ?? []) as Facility[]);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) void loadData(); }, [user]);

  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.full_name])), [patients]);
  const doctorNames = useMemo(() => new Map(doctors.map((doctor) => [doctor.id, doctor.full_name])), [doctors]);
  const facilityNames = useMemo(() => new Map(facilities.map((facility) => [facility.id, facility.name])), [facilities]);
  const filteredAppointments = useMemo(() => appointments.filter((appointment) => {
    const patientName = patientNames.get(appointment.patient_id) ?? '';
    const matchesSearch = !search.trim() || patientName.toLowerCase().includes(search.trim().toLowerCase()) || appointment.reason?.toLowerCase().includes(search.trim().toLowerCase());
    return matchesSearch && (statusFilter === 'all' || appointment.status === statusFilter) && (facilityFilter === 'all' || appointment.facility_id === facilityFilter) && (!dateFilter || dateKey(appointment.scheduled_time) === dateFilter);
  }), [appointments, dateFilter, facilityFilter, patientNames, search, statusFilter]);
  const queueAppointments = filteredAppointments.filter((appointment) => appointment.queue_number !== null).sort((first, second) => (first.queue_number ?? 0) - (second.queue_number ?? 0));

  const updateField = (field: keyof AppointmentForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); setFacilityFilter('all'); setDateFilter(''); };

  const saveAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canManage) return;
    setSaving(true); setFormError(null); setNotice(null);
    if (!form.patientId || !form.scheduledTime) { setFormError('Select a patient and appointment date and time.'); setSaving(false); return; }
    const queueNumber = form.queueNumber ? Number(form.queueNumber) : null;
    if (queueNumber !== null && (!Number.isInteger(queueNumber) || queueNumber < 1)) { setFormError('Queue number must be a positive whole number.'); setSaving(false); return; }
    const { error: saveError } = await supabaseClient.from('appointments').insert({ patient_id: form.patientId, healthcare_worker_id: form.doctorId || null, facility_id: form.facilityId || null, scheduled_time: new Date(form.scheduledTime).toISOString(), status: form.status, queue_number: queueNumber, reason: form.reason.trim() || null } as never);
    if (saveError) setFormError(saveError.message);
    else { setNotice('Appointment created successfully.'); setForm(emptyForm); setFormOpen(false); await loadData(); }
    setSaving(false);
  };

  const changeStatus = async (appointment: Appointment, status: AppointmentStatus) => {
    if (!canManage) return;
    setUpdatingId(appointment.id); setNotice(null); setError(null);
    const { error: updateError } = await supabaseClient.from('appointments').update({ status } as never).eq('id', appointment.id);
    if (updateError) setError(`Unable to update appointment status: ${updateError.message}`);
    else { setNotice(`Appointment marked ${statusLabel(status).toLowerCase()}.`); await loadData(); }
    setUpdatingId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Care coordination</p><h1 className="text-3xl font-bold tracking-tight text-foreground">Appointments &amp; Queue</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Schedule visits and manage the patient queue using existing appointment records.</p></div>{canManage && <Button type="button" onClick={() => { setFormError(null); setNotice(null); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Appointment</Button>}</div>
      {notice && <div className="mb-6 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success" role="status"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
      {!canManage && <div className="mb-6 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />You have read-only appointment access. Any permissions are enforced by your existing account and Supabase RLS.</div>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <section className="min-w-0 space-y-5">
          <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or notes" className="pl-9" aria-label="Search appointments" /></div><div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring pl-9" aria-label="Filter by status"><option value="all">All statuses</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div><select value={facilityFilter} onChange={(event) => setFacilityFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Filter by facility"><option value="all">All facilities</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select><div className="flex gap-2"><Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter by date" /><Button type="button" variant="ghost" size="icon" onClick={resetFilters} aria-label="Clear filters"><X className="h-4 w-4" /></Button></div></CardContent></Card>
          {error && <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Unable to load appointments</p><p className="mt-1">{error}</p><Button type="button" variant="outline" size="sm" onClick={() => void loadData()} className="mt-3">Try again</Button></div></div>}
          <div className="flex items-end justify-between"><div><h2 className="text-lg font-semibold text-foreground">Appointment list</h2><p className="text-sm text-muted-foreground">{loading ? 'Loading records...' : `${filteredAppointments.length} appointment${filteredAppointments.length === 1 ? '' : 's'} shown`}</p></div></div>
          {loading && !error && <div className="flex min-h-48 items-center justify-center rounded-lg border border-border/70 bg-card"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2 text-sm text-muted-foreground">Loading appointments...</span></div>}
          {!loading && !error && filteredAppointments.length === 0 && <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center"><CalendarDays className="h-8 w-8 text-muted-foreground/60" /><h3 className="mt-3 font-semibold text-foreground">No appointments scheduled yet.</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{search || dateFilter || statusFilter !== 'all' || facilityFilter !== 'all' ? 'Try clearing or changing the filters.' : canManage ? 'Create an appointment to start managing the queue.' : 'Appointments available to your account will appear here.'}</p></div>}
          {!loading && !error && filteredAppointments.length > 0 && <div className="space-y-4">{filteredAppointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} patientName={patientNames.get(appointment.patient_id) ?? 'Patient record unavailable'} doctorName={appointment.healthcare_worker_id ? doctorNames.get(appointment.healthcare_worker_id) ?? 'Assigned clinician' : 'Doctor not assigned'} facilityName={appointment.facility_id ? facilityNames.get(appointment.facility_id) ?? 'Assigned facility' : 'Facility not assigned'} canManage={canManage} updating={updatingId === appointment.id} onStatusChange={changeStatus} />)}</div>}
        </section>
        <aside className="space-y-6">
          {formOpen && canManage && <AppointmentForm patients={patients} doctors={doctors} facilities={facilities} form={form} saving={saving} error={formError} onChange={updateField} onSubmit={saveAppointment} onCancel={() => { if (!saving) { setFormOpen(false); setFormError(null); } }} />}
          {!formOpen && canManage && <Card className="hidden border-dashed border-border/80 bg-card/50 lg:block"><CardContent className="flex flex-col items-center px-6 py-10 text-center"><CalendarDays className="h-8 w-8 text-primary/70" /><h2 className="mt-4 font-semibold text-foreground">Schedule a visit</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Create appointments with existing patients, clinicians, and facilities.</p><Button type="button" variant="outline" onClick={() => setFormOpen(true)} className="mt-5"><Plus className="mr-2 h-4 w-4" />New Appointment</Button></CardContent></Card>}
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" />Queue view</CardTitle><CardDescription>{dateFilter ? `Queue for ${dateFilter}` : 'Select a date filter to focus the queue.'}</CardDescription></CardHeader><CardContent>{queueAppointments.length === 0 ? <p className="rounded-md bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">No queued appointments for the current filters.</p> : <div className="space-y-3">{queueAppointments.map((appointment) => <div key={appointment.id} className="flex items-start gap-3 rounded-md border border-border/70 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">{appointment.queue_number}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{patientNames.get(appointment.patient_id) ?? 'Patient record unavailable'}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(appointment.scheduled_time)}</p><span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses(appointment.status)}`}>{statusLabel(appointment.status)}</span></div></div>)}</div>}</CardContent></Card>
        </aside>
      </div>
    </div>
  );
}