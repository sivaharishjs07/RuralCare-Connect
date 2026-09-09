'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Children, FormEvent, useEffect, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Edit3,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isHealthcareStaff, ROLE_LABELS } from '@/lib/auth/roles';
import { OFFLINE_STORES, getCachedRecord, getCachedRecords, replaceCachedRecords, saveOutboxItem } from '@/lib/offline/indexed-db';
import { supabaseClient } from '@/lib/supabase/client';
import type {
  Appointment,
  Facility,
  FollowUp,
  HealthRecord,
  Patient,
  Profile,
  Referral,
  TriageAssessment,
} from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type RelatedRecords = {
  healthRecords: HealthRecord[];
  triageAssessments: TriageAssessment[];
  appointments: Appointment[];
  referrals: Referral[];
  followUps: FollowUp[];
  assignedWorker: Pick<Profile, 'full_name' | 'role'> | null;
  facilities: Facility[];
  assignedProfiles: Pick<Profile, 'id' | 'full_name' | 'role'>[];
};

type ConsultationForm = {
  diagnosis: string;
  recordType: string;
  bloodType: string;
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  notes: string;
};

const emptyConsultationForm: ConsultationForm = {
  diagnosis: '',
  recordType: 'consultation',
  bloodType: '',
  allergies: '',
  chronicConditions: '',
  currentMedications: '',
  notes: '',
};

function createLocalId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseList(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const emptyRelated: RelatedRecords = {
  healthRecords: [],
  triageAssessments: [],
  appointments: [],
  referrals: [],
  followUps: [],
  assignedWorker: null,
  facilities: [],
  assignedProfiles: [],
};

function valueOrFallback(value: string | null | undefined, fallback = 'Not provided') {
  return value?.trim() || fallback;
}

function formatDate(value: string | null | undefined, fallback = 'Not provided') {
  if (!value) return fallback;
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function readTriageNotes(notes: string | null) {
  const score = notes?.match(/^Risk score:\s*(.+)$/m)?.[1]?.trim() ?? 'Not recorded';
  const recommendation = notes?.match(/^Recommendation:\s*([\s\S]*?)(?:\n\n|$)/m)?.[1]?.trim();
  return {
    score,
    recommendation: recommendation || notes || 'Not recorded',
  };
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = status === 'standard'
    ? 'Medium'
    : status === 'urgent'
      ? 'High'
      : status === 'critical'
        ? 'Emergency'
        : status === 'low'
          ? 'Low'
          : status?.replaceAll('_', ' ') || 'Not recorded';

  return (
    <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold capitalize text-primary">
      {label}
    </span>
  );
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof MapPin }) {
  return (
    <div className="flex gap-3">
      {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
      <div className={!Icon ? 'pl-7' : ''}>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function SectionEmpty({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">{message}</div>;
}

function SectionHeader({ icon: Icon, title, count }: { icon: typeof HeartPulse; title: string; count: number }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{count} record{count === 1 ? '' : 's'}</span>
    </div>
  );
}

function RecordList({ children, emptyMessage }: { children: ReactNode; emptyMessage: string }) {
  return <div className="space-y-3">{Children.count(children) > 0 ? children : <SectionEmpty message={emptyMessage} />}</div>;
}

export default function PatientProfilePage() {
  const params = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [related, setRelated] = useState<RelatedRecords>(emptyRelated);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [consultationForm, setConsultationForm] = useState<ConsultationForm>(emptyConsultationForm);
  const [consultationSaving, setConsultationSaving] = useState(false);
  const [consultationNotice, setConsultationNotice] = useState<string | null>(null);
  const [offlineBanner, setOfflineBanner] = useState<string | null>(null);

  useEffect(() => {
    const patientId = params.id;
    if (!patientId) return;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      setRelatedError(null);
      setOfflineBanner(navigator.onLine ? null : 'Offline view — showing cached patient and appointment information.');

      if (!navigator.onLine) {
        try {
          const [cachedPatient, cachedRecords, cachedTriage, cachedAppointments, cachedReferrals, cachedFollowUps, cachedFacilities, cachedProfiles] = await Promise.all([
            getCachedRecord<Patient>(OFFLINE_STORES.patient_cache, patientId),
            getCachedRecords<HealthRecord>(OFFLINE_STORES.health_record_cache),
            getCachedRecords<TriageAssessment>(OFFLINE_STORES.triage_cache),
            getCachedRecords<Appointment>(OFFLINE_STORES.appointment_cache),
            getCachedRecords<Referral>(OFFLINE_STORES.referral_cache),
            getCachedRecords<FollowUp>(OFFLINE_STORES.follow_up_cache),
            getCachedRecords<Facility>(OFFLINE_STORES.facility_cache),
            getCachedRecords<Profile>(OFFLINE_STORES.profile_cache),
          ]);
          if (!cachedPatient) {
            setError('This patient record is not available in the offline cache yet.');
            setLoading(false);
            return;
          }
          setPatient(cachedPatient);
          const patientHealthRecords = cachedRecords.filter((item) => item.patient_id === patientId);
          const patientAppointments = cachedAppointments.filter((item) => item.patient_id === patientId);
          const patientReferrals = cachedReferrals.filter((item) => item.patient_id === patientId);
          const patientFollowUps = cachedFollowUps.filter((item) => item.patient_id === patientId);
          const patientTriage = cachedTriage.filter((item) => item.patient_id === patientId);
          setRelated({
            healthRecords: patientHealthRecords,
            triageAssessments: patientTriage,
            appointments: patientAppointments,
            referrals: patientReferrals,
            followUps: patientFollowUps,
            assignedWorker: null,
            facilities: cachedFacilities,
            assignedProfiles: cachedProfiles.filter((person) => person.role === 'health_worker' || person.role === 'doctor' || person.role === 'admin'),
          });
          setLoading(false);
          return;
        } catch {
          setError('This patient record is not available in the offline cache yet.');
          setLoading(false);
          return;
        }
      }

      try {
        const patientResult = await supabaseClient.from('patients').select('*').eq('id', patientId).maybeSingle();
        if (patientResult.error) {
          setError(patientResult.error.message);
          setLoading(false);
          return;
        }
        if (!patientResult.data) {
          setError('This patient record could not be found or is not available to your account.');
          setLoading(false);
          return;
        }

        const currentPatient = patientResult.data as Patient;
        setPatient(currentPatient);
        try {
          await replaceCachedRecords(OFFLINE_STORES.patient_cache, [currentPatient]);
        } catch {
          // do nothing; online data should still work even if cache write fails.
        }

        const registeredBy = (currentPatient as any).registered_by as string | undefined;
        const results = await Promise.all([
          supabaseClient.from('health_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
          supabaseClient.from('triage_assessments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
          supabaseClient.from('appointments').select('*').eq('patient_id', patientId).order('scheduled_time', { ascending: false }),
          supabaseClient.from('referrals').select('*').eq('patient_id', patientId).order('referred_at', { ascending: false }),
          supabaseClient.from('follow_ups').select('*').eq('patient_id', patientId).order('scheduled_date', { ascending: false }),
          registeredBy
            ? supabaseClient.from('profiles').select('full_name, role').eq('id', registeredBy).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          supabaseClient.from('facilities').select('*').order('name', { ascending: true }),
          supabaseClient.from('profiles').select('id, full_name, role').in('role', ['health_worker', 'doctor', 'admin']).order('full_name', { ascending: true }),
        ]);

        const failedResult = results.find((result) => result.error);
        if (failedResult?.error) setRelatedError(failedResult.error.message);
        const nextRelated = {
          healthRecords: (results[0].data ?? []) as HealthRecord[],
          triageAssessments: (results[1].data ?? []) as TriageAssessment[],
          appointments: (results[2].data ?? []) as Appointment[],
          referrals: (results[3].data ?? []) as Referral[],
          followUps: (results[4].data ?? []) as FollowUp[],
          assignedWorker: results[5].data as Pick<Profile, 'full_name' | 'role'> | null,
          facilities: (results[6].data ?? []) as Facility[],
          assignedProfiles: (results[7].data ?? []) as Pick<Profile, 'id' | 'full_name' | 'role'>[],
        };
        setRelated(nextRelated);
        try {
          await Promise.all([
            replaceCachedRecords(OFFLINE_STORES.appointment_cache, nextRelated.appointments),
            replaceCachedRecords(OFFLINE_STORES.facility_cache, nextRelated.facilities),
            replaceCachedRecords(OFFLINE_STORES.health_record_cache, nextRelated.healthRecords),
            replaceCachedRecords(OFFLINE_STORES.triage_cache, nextRelated.triageAssessments),
            replaceCachedRecords(OFFLINE_STORES.referral_cache, nextRelated.referrals),
            replaceCachedRecords(OFFLINE_STORES.follow_up_cache, nextRelated.followUps),
            replaceCachedRecords(OFFLINE_STORES.profile_cache, nextRelated.assignedProfiles),
          ]);
        } catch {
          // ignore cache write errors
        }
      } catch {
        const cachedPatient = await getCachedRecord<Patient>(OFFLINE_STORES.patient_cache, patientId).catch(() => undefined);
        if (cachedPatient) {
          setPatient(cachedPatient);
          const [cachedRecords, cachedTriage, cachedAppointments, cachedReferrals, cachedFollowUps, cachedFacilities, cachedProfiles] = await Promise.all([
            getCachedRecords<HealthRecord>(OFFLINE_STORES.health_record_cache),
            getCachedRecords<TriageAssessment>(OFFLINE_STORES.triage_cache),
            getCachedRecords<Appointment>(OFFLINE_STORES.appointment_cache),
            getCachedRecords<Referral>(OFFLINE_STORES.referral_cache),
            getCachedRecords<FollowUp>(OFFLINE_STORES.follow_up_cache),
            getCachedRecords<Facility>(OFFLINE_STORES.facility_cache),
            getCachedRecords<Profile>(OFFLINE_STORES.profile_cache),
          ]);
          setRelated({
            healthRecords: cachedRecords.filter((item) => item.patient_id === patientId),
            triageAssessments: cachedTriage.filter((item) => item.patient_id === patientId),
            appointments: cachedAppointments.filter((item) => item.patient_id === patientId),
            referrals: cachedReferrals.filter((item) => item.patient_id === patientId),
            followUps: cachedFollowUps.filter((item) => item.patient_id === patientId),
            assignedWorker: null,
            facilities: cachedFacilities,
            assignedProfiles: cachedProfiles.filter((person) => person.role === 'health_worker' || person.role === 'doctor' || person.role === 'admin'),
          });
          setOfflineBanner('Offline view — showing cached patient and appointment information.');
        } else {
          setError('This patient record is not available in the offline cache yet.');
        }
      }
      setLoading(false);
    };

    void loadProfile();
  }, [params.id]);

  const saveConsultationRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !patient || !isHealthcareStaff(role)) return;

    const diagnosis = consultationForm.diagnosis.trim();
    const notes = consultationForm.notes.trim();
    if (!diagnosis && !notes) {
      setConsultationNotice('Add a diagnosis or consultation note before saving.');
      return;
    }

    setConsultationSaving(true);
    setConsultationNotice(null);

    const recordId = createLocalId();
    const now = new Date().toISOString();
    const payload = {
      id: recordId,
      patient_id: patient.id,
      facility_id: patient.facility_id ?? null,
      record_type: consultationForm.recordType || 'consultation',
      diagnosis: diagnosis || null,
      blood_type: consultationForm.bloodType.trim() || null,
      allergies: parseList(consultationForm.allergies),
      chronic_conditions: parseList(consultationForm.chronicConditions),
      current_medications: parseList(consultationForm.currentMedications),
      notes: notes || null,
      recorded_by: user.id,
      created_at: now,
      updated_at: now,
    } satisfies Partial<HealthRecord> & { id: string; patient_id: string; recorded_by: string };

    if (!navigator.onLine) {
      await saveOutboxItem({
        localOperationId: recordId,
        operationType: 'insert',
        resource: 'health_records',
        ownerId: user.id,
        payload,
        createdAt: now,
        retryCount: 0,
        syncStatus: 'pending',
      });
      setConsultationForm(emptyConsultationForm);
      setConsultationNotice('Saved offline. It will sync automatically when internet connection is restored.');
      setConsultationSaving(false);
      return;
    }

    const { error } = await supabaseClient.from('health_records').insert(payload as never);
    if (error) {
      setConsultationNotice(`Unable to save consultation record: ${error.message}`);
      setConsultationSaving(false);
      return;
    }

    setConsultationForm(emptyConsultationForm);
    setConsultationNotice('Consultation record saved successfully.');
    setRelated((current) => ({ ...current, healthRecords: [payload as HealthRecord, ...current.healthRecords] }));
    setConsultationSaving(false);
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" />Loading patient profile...</div>;
  }

  if (error || !patient) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="h-6 w-6" /></div>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Unable to open patient profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? 'The requested patient record is unavailable.'}</p>
        <Button asChild variant="outline" className="mt-6"><Link href="/patients"><ArrowLeft className="mr-2 h-4 w-4" />Back to Patients</Link></Button>
      </div>
    );
  }

  const canEdit = isHealthcareStaff(role);
  const address = [patient.address, patient.district, patient.region].filter(Boolean).join(', ');
  const facilityNames = new Map(related.facilities.map((facility) => [facility.id, facility.name]));
  const assignedProfileNames = new Map(related.assignedProfiles.map((profile) => [profile.id, profile.full_name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-2"><Link href="/patients"><ArrowLeft className="mr-2 h-4 w-4" />Back to Patients</Link></Button>
        {canEdit && <Button asChild><Link href={`/patients?edit=${patient.id}`}><Edit3 className="mr-2 h-4 w-4" />Edit Patient</Link></Button>}
      </div>

      <Card className="overflow-hidden border-primary/15">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><UserRound className="h-8 w-8" /></div>
              <div>
                <p className="text-sm font-medium text-primary">Patient profile</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{patient.full_name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Patient ID: {patient.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
              <span className="text-muted-foreground">Created</span><span className="font-medium text-foreground">{formatDateTime(patient.created_at)}</span>
              <span className="text-muted-foreground">Updated</span><span className="font-medium text-foreground">{formatDateTime(patient.updated_at)}</span>
            </div>
          </div>
        </div>
        <CardContent className="p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Date of birth" value={formatDate(patient.date_of_birth)} icon={CalendarDays} />
            <DetailItem label="Gender" value={valueOrFallback(patient.gender)} icon={Users} />
            <DetailItem label="Phone" value={valueOrFallback(patient.phone)} icon={Phone} />
            <DetailItem label="Address" value={valueOrFallback(address)} icon={MapPin} />
            <DetailItem label="Emergency contact" value={patient.emergency_contact_phone ? `${valueOrFallback(patient.emergency_contact_name)} · ${patient.emergency_contact_phone}` : valueOrFallback(patient.emergency_contact_name)} icon={ShieldAlert} />
            <DetailItem label="Assigned health worker" value={related.assignedWorker ? `${related.assignedWorker.full_name} (${ROLE_LABELS[related.assignedWorker.role]})` : 'Not assigned'} icon={Stethoscope} />
            <DetailItem label="National ID" value={valueOrFallback(patient.national_id)} />
            <DetailItem label="Region" value={valueOrFallback(patient.region)} />
          </div>
        </CardContent>
      </Card>

      {relatedError && <div className="mt-6 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>Some related records could not be loaded: {relatedError}</span></div>}

      <Tabs defaultValue="health" className="mt-8">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="health">Health records</TabsTrigger>
          <TabsTrigger value="triage">Triage</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <Card><CardHeader><SectionHeader icon={HeartPulse} title="Health records" count={related.healthRecords.length} /><CardDescription>Existing clinical information available for this patient.</CardDescription></CardHeader><CardContent><RecordList emptyMessage="No health records are available for this patient.">{related.healthRecords.map((record) => <div key={record.id} className="rounded-lg border border-border/70 p-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><DetailItem label="Blood type" value={valueOrFallback(record.blood_type)} /><DetailItem label="Recorded" value={formatDateTime(record.created_at)} /><DetailItem label="Last updated" value={formatDateTime(record.updated_at)} /></div><div className="mt-4 grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-3"><DetailItem label="Allergies" value={record.allergies?.join(', ') || 'None recorded'} /><DetailItem label="Chronic conditions" value={record.chronic_conditions?.join(', ') || 'None recorded'} /><DetailItem label="Current medications" value={record.current_medications?.join(', ') || 'None recorded'} /></div>{record.notes && <p className="mt-4 border-t border-border/70 pt-4 text-sm text-muted-foreground">{record.notes}</p>}</div>)}</RecordList></CardContent></Card>
        </TabsContent>

        <TabsContent value="triage">
          <Card><CardHeader><SectionHeader icon={ShieldAlert} title="Triage assessments" count={related.triageAssessments.length} /><CardDescription>Assessment risk levels, scores, and recorded recommendations.</CardDescription></CardHeader><CardContent><RecordList emptyMessage="No triage assessments are available for this patient.">{related.triageAssessments.map((assessment) => { const assessmentAny = assessment as any; const triageNotes = readTriageNotes(assessmentAny.notes); return <div key={assessment.id} className="rounded-lg border border-border/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="text-sm font-semibold text-foreground">Risk level</span><StatusBadge status={assessmentAny.severity} /></div><span className="text-xs text-muted-foreground">{formatDateTime(assessment.created_at)}</span></div><dl className="mt-4 grid gap-4 sm:grid-cols-3"><DetailItem label="Chief complaint" value={valueOrFallback(assessmentAny.chief_complaint)} /><DetailItem label="Risk score" value={triageNotes.score} /><DetailItem label="Recommendation" value={triageNotes.recommendation} /></dl></div>; })}</RecordList></CardContent></Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card><CardHeader><SectionHeader icon={CalendarDays} title="Appointments" count={related.appointments.length} /><CardDescription>Scheduled and completed appointment records.</CardDescription></CardHeader><CardContent><RecordList emptyMessage="No appointments are available for this patient.">{related.appointments.map((appointment) => { const appointmentAny = appointment as any; return <div key={appointment.id} className="rounded-lg border border-border/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-primary" /><span className="font-semibold text-foreground">{formatDateTime(appointmentAny.scheduled_time ?? appointmentAny.appointment_date)}</span></div><StatusBadge status={appointment.status} /></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><DetailItem label="Reason" value={valueOrFallback(appointmentAny.reason ?? appointmentAny.notes)} /><DetailItem label="Queue number" value={appointment.queue_number?.toString() || 'Not assigned'} /></div></div>; })}</RecordList></CardContent></Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card><CardHeader><SectionHeader icon={ClipboardList} title="Referrals" count={related.referrals.length} /><CardDescription>Referral status, destination, and completion tracking.</CardDescription></CardHeader><CardContent><RecordList emptyMessage="No referrals are available for this patient.">{related.referrals.map((referral) => { const referralAny = referral as any; return <div key={referral.id} className="rounded-lg border border-border/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-foreground">{valueOrFallback(referralAny.reason)}</p><p className="mt-1 text-xs text-muted-foreground">Referred {formatDateTime(referralAny.referred_at ?? referralAny.created_at)}</p></div><StatusBadge status={referral.status} /></div><dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><DetailItem label="From facility" value={facilityNames.get(referralAny.from_facility_id ?? referralAny.source_facility_id) ?? 'Source facility unavailable'} /><DetailItem label="Destination" value={facilityNames.get(referralAny.to_facility_id ?? referralAny.destination_facility_id) ?? 'Destination facility unavailable'} /><DetailItem label="Priority" value={valueOrFallback(referralAny.priority)} /><DetailItem label="Diagnosis" value={valueOrFallback(referralAny.diagnosis)} /><DetailItem label="Arrived" value={formatDateTime(referralAny.arrived_at)} /><DetailItem label="Completed" value={formatDateTime(referralAny.completed_at)} /></dl></div>; })}</RecordList></CardContent></Card>
        </TabsContent>

        <TabsContent value="followups">
          <Card><CardHeader><SectionHeader icon={CheckCircle2} title="Follow-ups" count={related.followUps.length} /><CardDescription>Follow-up dates, status, assignments, and outcomes.</CardDescription></CardHeader><CardContent><RecordList emptyMessage="No follow-ups are available for this patient.">{related.followUps.map((followUp) => { const followUpAny = followUp as any; const relatedReferral = related.referrals.find((referral) => referral.id === followUpAny.referral_id); return <div key={followUp.id} className="rounded-lg border border-border/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-primary" /><span className="font-semibold text-foreground">{formatDate(followUpAny.scheduled_date ?? followUpAny.follow_up_date)}</span></div><StatusBadge status={followUp.status} /></div><dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><DetailItem label="Facility" value={followUpAny.facility_id ? facilityNames.get(followUpAny.facility_id) ?? 'Facility unavailable' : 'Not assigned'} /><DetailItem label="Assigned worker" value={followUpAny.assigned_to ?? followUpAny.health_worker_id ? assignedProfileNames.get(followUpAny.assigned_to ?? followUpAny.health_worker_id) ?? 'Worker unavailable' : 'Not assigned'} /><DetailItem label="Related referral" value={relatedReferral ? (relatedReferral as any).reason : 'No related referral'} /><DetailItem label="Notes" value={valueOrFallback(followUpAny.notes)} /><DetailItem label="Outcome" value={valueOrFallback(followUpAny.outcome)} /><DetailItem label="Created" value={formatDateTime(followUp.created_at)} /></dl></div>; })}</RecordList></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}