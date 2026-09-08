'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { assessSymptoms, type SymptomAssessmentResult } from '@/lib/triage/symptom-assessment';
import { supabaseClient } from '@/lib/supabase/client';
import {
  saveOutboxItem,
  deleteRecord,
} from '@/lib/offline/indexed-db';
import {
  syncPendingPatientAppointments,
  type PendingPatientAppointment,
  type PendingPatientTriage,
} from '@/lib/offline/appointment-sync';
import { usePatientLanguage } from '@/lib/i18n/patient-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Option = {
  id: string;
  name: string;
};

type LoadError = 'profile' | 'facilities' | 'doctors';

type BookingDetails = {
  facilityName: string;
  doctorName: string;
  appointmentDate: string;
  offline: boolean;
};

function createLocalId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatAppointmentDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PatientAppointmentBookingPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { t } = usePatientLanguage();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Option[]>([]);
  const [doctors, setDoctors] = useState<Option[]>([]);
  const [facilityId, setFacilityId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [assessment, setAssessment] = useState<SymptomAssessmentResult | null>(null);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [triageSaved, setTriageSaved] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<BookingDetails | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'patient' || !user?.id) return;

    const syncPending = async () => {
      if (!navigator.onLine) return;

      try {
        const syncedCount = await syncPendingPatientAppointments(user.id);
        if (syncedCount > 0) setSyncNotice(t('offlineAppointmentSynced'));
      } catch {
        // Pending items remain in IndexedDB for the next online attempt.
      }
    };

    void syncPending();
    window.addEventListener('online', syncPending);
    return () => window.removeEventListener('online', syncPending);
  }, [role, t, user?.id]);

  useEffect(() => {
    if (authLoading || role !== 'patient' || !user?.id) return;

    let active = true;

    const loadBookingData = async () => {
      setLoadingData(true);
      setLoadError(null);

      const [patientResult, facilityResult, doctorResult] = await Promise.all([
        supabaseClient
          .from('patients')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle(),
        supabaseClient.from('facilities').select('id, name').order('name', { ascending: true }),
        supabaseClient
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'doctor')
          .order('full_name', { ascending: true }),
      ]);

      if (!active) return;

      if (patientResult.error || !patientResult.data) {
        setLoadError('profile');
      } else if (facilityResult.error) {
        setPatientId(patientResult.data.id);
        setLoadError('facilities');
      } else if (doctorResult.error) {
        setPatientId(patientResult.data.id);
        setFacilities((facilityResult.data ?? []) as Option[]);
        setLoadError('doctors');
      } else {
        setPatientId(patientResult.data.id);
        setFacilities((facilityResult.data ?? []) as Option[]);
        setDoctors((doctorResult.data ?? []).map((doctor) => ({ id: doctor.id, name: doctor.full_name })));
      }

      setLoadingData(false);
    };

    void loadBookingData();

    return () => {
      active = false;
    };
  }, [authLoading, role, user?.id]);

  const analyze = () => {
    if (!symptoms.trim()) {
      setFormError(t('pleaseDescribeSymptoms'));
      return;
    }

    setFormError(null);
    setBookingError(null);
    setTriageSaved(false);
    setAssessment(assessSymptoms(symptoms));
  };

  const handleSymptomsChange = (value: string) => {
    setSymptoms(value);
    setAssessment(null);
    setTriageSaved(false);
    setBookingError(null);
    setFormError(null);
  };

  const confirmAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setBookingError(null);

    if (!patientId || !user?.id) {
      setFormError(t('profileMissing'));
      return;
    }
    if (!facilityId || !doctorId) {
      setFormError(t('unableCreateAppointment'));
      return;
    }
    if (!date || !time) {
      setFormError(t('dateRequired'));
      return;
    }
    if (!assessment) {
      setFormError(t('pleaseDescribeSymptoms'));
      return;
    }

    const appointmentDate = new Date(`${date}T${time}`);
    if (Number.isNaN(appointmentDate.getTime())) {
      setFormError(t('dateRequired'));
      return;
    }

    setSubmitting(true);

    const facilityName = facilities.find((facility) => facility.id === facilityId)?.name ?? t('notAssigned');
    const doctorName = doctors.find((doctor) => doctor.id === doctorId)?.name ?? t('notAssigned');

    if (!navigator.onLine) {
      const triageId = createLocalId();
      const appointmentId = createLocalId();
      const createdAt = new Date().toISOString();
      const triagePayload: PendingPatientTriage = {
        id: triageId,
        patient_id: patientId,
        symptoms: symptoms.trim(),
        risk_level: assessment.riskLevel,
        risk_score: assessment.riskScore,
        recommendation: assessment.recommendation,
        created_by: user.id,
      };
      const appointmentPayload: PendingPatientAppointment = {
        id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        facility_id: facilityId,
        appointment_date: appointmentDate.toISOString(),
        status: 'scheduled',
        queue_number: null,
        notes: null,
      };

      try {
        await saveOutboxItem({
          localOperationId: triageId,
          operationType: 'insert',
          resource: 'triage_assessments',
          ownerId: user.id,
          payload: triagePayload,
          createdAt,
          retryCount: 0,
          syncStatus: 'pending',
        });
        await saveOutboxItem({
          localOperationId: appointmentId,
          operationType: 'insert',
          resource: 'appointments',
          ownerId: user.id,
          payload: appointmentPayload,
          createdAt: new Date(Date.parse(createdAt) + 1).toISOString(),
          retryCount: 0,
          syncStatus: 'pending',
        });
      } catch (error) {
        try {
          await deleteRecord('outbox', triageId);
        } catch {
          // Keep the UI error focused on the failed local save.
        }
        setBookingError(error instanceof Error ? error.message : t('unableCreateAppointment'));
        setSubmitting(false);
        return;
      }

      setBookedAppointment({ facilityName, doctorName, appointmentDate: appointmentDate.toISOString(), offline: true });
      setSubmitting(false);
      return;
    }

    if (!triageSaved) {
      const { error: triageError } = await supabaseClient.from('triage_assessments').insert({
        patient_id: patientId,
        symptoms: symptoms.trim(),
        risk_level: assessment.riskLevel,
        risk_score: assessment.riskScore,
        recommendation: assessment.recommendation,
        created_by: user.id,
      } as never);

      if (triageError) {
        setBookingError(`${t('unableSaveAssessment')} ${triageError.message}`);
        setSubmitting(false);
        return;
      }

      setTriageSaved(true);
    }

    const { error: appointmentError } = await supabaseClient.from('appointments').insert({
      patient_id: patientId,
      doctor_id: doctorId,
      facility_id: facilityId,
      appointment_date: appointmentDate.toISOString(),
      status: 'scheduled',
      queue_number: null,
      notes: null,
    } as never);

    if (appointmentError) {
      setBookingError(`${t('unableCreateAppointment')} ${appointmentError.message}`);
      setSubmitting(false);
      return;
    }

    setBookedAppointment({
      facilityName,
      doctorName,
      appointmentDate: appointmentDate.toISOString(),
      offline: false,
    });
    setSubmitting(false);
  };

  if (authLoading || loadingData) {
    return <PageMessage icon={<Loader2 className="h-5 w-5 animate-spin" />} message={t('loading')} />;
  }

  if (role !== 'patient') {
    return <PageMessage icon={<AlertCircle className="h-5 w-5" />} message={t('patientOnlyBooking')} />;
  }

  if (loadError) {
    const message = loadError === 'profile'
      ? t('profileMissing')
      : t('unableLoadAppointments');
    return <PageMessage icon={<AlertCircle className="h-5 w-5" />} message={message} />;
  }

  if (bookedAppointment) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-success">
              <CheckCircle2 className="h-5 w-5" />
              {t('appointmentBookedSuccess')}
            </CardTitle>
            <CardDescription>{t('appointmentDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {bookedAppointment.offline && <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-warning-foreground" role="status">{t('appointmentSavedOffline')}</div>}
            <Detail label={t('facility')} value={bookedAppointment.facilityName} />
            <Detail label={t('doctor')} value={bookedAppointment.doctorName} />
            <Detail label={t('dateAndTime')} value={formatAppointmentDate(bookedAppointment.appointmentDate)} />
            <Button type="button" onClick={() => window.location.reload()}>{t('bookAppointment')}</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">{t('appointments')}</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('bookAppointment')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('bookAndView')}</p>
      </div>

      {syncNotice && <div className="mb-6 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success" role="status">{syncNotice}</div>}

      {(formError || bookingError) && (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{formError ?? bookingError}</span>
        </div>
      )}

      <form onSubmit={confirmAppointment} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('appointmentDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-facility">{t('facility')}</Label>
              <select id="booking-facility" required value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="select-field">
                <option value="">{t('notAssigned')}</option>
                {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-doctor">{t('doctor')}</Label>
              <select id="booking-doctor" required value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className="select-field">
                <option value="">{t('notAssigned')}</option>
                {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-date">{t('date')}</Label>
                <Input id="booking-date" required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-time">{t('time')}</Label>
                <Input id="booking-time" required type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('symptoms')}</CardTitle>
            <CardDescription>{t('symptomInstructions')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              id="booking-symptoms"
              required
              value={symptoms}
              onChange={(event) => handleSymptomsChange(event.target.value)}
              rows={5}
              className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={t('whatSymptoms')}
            />
            <Button type="button" variant="outline" onClick={analyze} disabled={!symptoms.trim()}>{t('analyzeSymptoms')}</Button>
            <p className="text-xs leading-relaxed text-muted-foreground">{t('medicalDisclaimer')}</p>
          </CardContent>
        </Card>

        {assessment && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">{t('reviewSymptoms')}</CardTitle>
              <CardDescription>{t('symptomDisclaimer')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Detail label={t('facility')} value={facilities.find((facility) => facility.id === facilityId)?.name ?? t('notAssigned')} />
              <Detail label={t('doctor')} value={doctors.find((doctor) => doctor.id === doctorId)?.name ?? t('notAssigned')} />
              <Detail label={t('symptoms')} value={symptoms.trim()} />
              <Detail label={t('riskLevel')} value={t(assessment.riskLevel)} />
              <Detail label={t('riskScore')} value={String(assessment.riskScore)} />
              <Detail label={t('recommendation')} value={assessment.recommendation} />
              <div className="rounded-md bg-muted/50 p-3">
                <p className="font-medium text-foreground">{t('appointmentDetails')}</p>
                <p className="mt-1 flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" />{date || t('notAssigned')}</p>
                <p className="mt-1 flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4" />{time || t('notAssigned')}</p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => { setAssessment(null); setTriageSaved(false); setBookingError(null); }}>{t('cancel')}</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitting ? t('saving') : t('confirmAppointment')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-foreground">{value}</p>
    </div>
  );
}

function PageMessage({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl items-center justify-center px-4 py-8 text-center sm:px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        {icon}
        <span>{message}</span>
      </div>
    </main>
  );
}
