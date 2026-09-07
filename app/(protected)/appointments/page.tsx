'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Appointment, Facility, Patient, Profile } from '@/lib/types/database';
import {
  assessSymptoms,
  type SymptomAssessmentResult,
} from '@/lib/triage/symptom-assessment';
import { usePatientLanguage } from '@/lib/i18n/patient-language';
import { CalendarDays, Check, Clock, Plus, Search, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

type AppointmentStatus = NonNullable<Appointment['status']>;

const STATUS_OPTIONS: AppointmentStatus[] = [
  'scheduled',
  'checked_in',
  'in_consultation',
  'completed',
  'cancelled',
  'no_show',
];

type AppointmentForm = {
  patientId: string;
  doctorId: string;
  facilityId: string;
  appointmentDate: string;
  status: AppointmentStatus;
  queueNumber: string;
  notes: string;
  symptoms: string;
};

const emptyForm: AppointmentForm = {
  patientId: '',
  doctorId: '',
  facilityId: '',
  appointmentDate: '',
  status: 'scheduled',
  queueNumber: '',
  notes: '',
  symptoms: '',
};

function formatDateTime(value: string | null, locale = 'en-IN') {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getStatusLabel(status: AppointmentStatus | null) {
  if (!status) return 'Unknown';

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status: AppointmentStatus | null) {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'checked_in':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'in_consultation':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'no_show':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export default function AppointmentsPage() {
  const { profile, user } = useAuth();
  const { language, t } = usePatientLanguage();
  const patientLocale = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

  const isPatient = profile?.role === 'patient';

  function patientStatusLabel(status: AppointmentStatus | null) {
    if (!isPatient) return getStatusLabel(status);
    if (status === 'scheduled') return t('scheduled');
    if (status === 'completed') return t('completed');
    if (status === 'cancelled') return t('cancelled');
    if (status === 'checked_in') return t('checkedIn');
    if (status === 'in_consultation') return t('inConsultation');
    if (status === 'no_show') return t('noShow');
    return t('notAssigned');
  }

  function patientRecommendation(riskLevel: SymptomAssessmentResult['riskLevel']) {
    switch (riskLevel) {
      case 'emergency': return t('emergencyRecommendation');
      case 'high': return t('highRecommendation');
      case 'medium': return t('mediumRecommendation');
      default: return t('lowRecommendation');
    }
  }

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  const [myPatient, setMyPatient] = useState<Patient | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | AppointmentStatus
  >('all');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const [symptomAssessment, setSymptomAssessment] =
    useState<SymptomAssessmentResult | null>(null);

  async function loadData() {
    if (!profile) return;

    setLoading(true);
    setError('');

    try {
      let patientRecord: Patient | null = null;

      if (isPatient) {
        const { data, error: patientError } = await supabaseClient
          .from('patients')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (patientError) {
          throw new Error(
            isPatient
              ? `${t('unableLoadProfile')} — ${patientError.message}`
              : `Unable to load your patient profile — ${patientError.message}`
          );
        }

        if (!data) {
          throw new Error(
            'Your patient profile is not connected yet. Please contact the administrator.'
          );
        }

        patientRecord = data as Patient;
        setMyPatient(patientRecord);
      }

      let appointmentsQuery = supabaseClient
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (isPatient && patientRecord) {
        appointmentsQuery = appointmentsQuery.eq(
          'patient_id',
          patientRecord.id
        );
      }

      const appointmentsResult = await appointmentsQuery;

      if (appointmentsResult.error) {
        throw new Error(
          `${isPatient ? t('unableLoadAppointments') : 'Unable to load appointments'} — ${appointmentsResult.error.message}`
        );
      }

      let loadedPatients: Patient[] = [];

      if (!isPatient) {
        const { data, error: patientsError } = await supabaseClient
          .from('patients')
          .select('*')
          .order('full_name', { ascending: true });

        if (patientsError) {
          throw new Error(
            `Unable to load patients — ${patientsError.message}`
          );
        }

        loadedPatients = (data || []) as Patient[];
      } else if (patientRecord) {
        loadedPatients = [patientRecord];
      }

      setPatients(loadedPatients);

      const [doctorsResult, facilitiesResult] = await Promise.all([
        supabaseClient
          .from('profiles')
          .select('*')
          .eq('role', 'doctor')
          .order('full_name', { ascending: true }),

        supabaseClient
          .from('facilities')
          .select('*')
          .order('name', { ascending: true }),
      ]);

      if (doctorsResult.error) {
        throw new Error(
          `Unable to load doctors — ${doctorsResult.error.message}`
        );
      }

      if (facilitiesResult.error) {
        throw new Error(
          `Unable to load facilities — ${facilitiesResult.error.message}`
        );
      }

      setAppointments((appointmentsResult.data || []) as Appointment[]);
      setDoctors((doctorsResult.data || []) as Profile[]);
      setFacilities((facilitiesResult.data || []) as Facility[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isPatient
            ? t('unableLoadAppointments')
            : 'Unable to load appointments'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile) {
      void loadData();
    }
  }, [profile, isPatient]);

  const patientMap = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient])),
    [patients]
  );

  const doctorMap = useMemo(
    () => new Map(doctors.map((doctor) => [doctor.id, doctor])),
    [doctors]
  );

  const facilityMap = useMemo(
    () => new Map(facilities.map((facility) => [facility.id, facility])),
    [facilities]
  );

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const patient = patientMap.get(appointment.patient_id);
      const doctor = appointment.doctor_id
        ? doctorMap.get(appointment.doctor_id)
        : undefined;
      const facility = appointment.facility_id
        ? facilityMap.get(appointment.facility_id)
        : undefined;

      const patientName = patient?.full_name || '';
      const district = patient?.district || '';
      const gender = patient?.gender || '';
      const doctorName = doctor?.full_name || '';
      const facilityName = facility?.name || '';
      const notes = appointment.notes || '';

      const matchesSearch =
        !query ||
        patientName.toLowerCase().includes(query) ||
        district.toLowerCase().includes(query) ||
        gender.toLowerCase().includes(query) ||
        doctorName.toLowerCase().includes(query) ||
        facilityName.toLowerCase().includes(query) ||
        notes.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    appointments,
    search,
    statusFilter,
    patientMap,
    doctorMap,
    facilityMap,
  ]);

  function updateForm<K extends keyof AppointmentForm>(
    field: K,
    value: AppointmentForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
   * Creates a notification for the patient.
   * The notification is linked to both the patient's profile and patient row.
   */
  async function createPatientNotification(
    patientId: string,
    title: string,
    message: string
  ) {
    const { data: patientData, error: patientError } = await supabaseClient
      .from('patients')
      .select('profile_id')
      .eq('id', patientId)
      .maybeSingle();

    if (patientError) {
      console.error(
        'Unable to find patient profile for notification:',
        patientError.message
      );
      return;
    }

    const profileId = patientData?.profile_id;

    if (!profileId) {
      console.warn(
        'Patient has no connected profile. Notification was not created.'
      );
      return;
    }

    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: profileId,
        title,
        message,
        is_read: false,
      });

    if (notificationError) {
      console.error(
        'Unable to create appointment notification:',
        notificationError.message
      );
    }
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (isPatient && !symptomAssessment) {
      if (!form.symptoms.trim()) {
        setError(t('pleaseDescribeSymptoms'));
        return;
      }

      setSymptomAssessment(assessSymptoms(form.symptoms));
      return;
    }

    const selectedPatientId = isPatient
      ? myPatient?.id
      : form.patientId;

    if (!selectedPatientId) {
      setError(
        isPatient
          ? t('profileMissing')
          : 'Please select a patient.'
      );
      return;
    }

    if (!form.appointmentDate) {
      setError(
        isPatient
          ? t('dateRequired')
          : 'Please select an appointment date and time.'
      );
      return;
    }

    const queueNumber = form.queueNumber.trim()
      ? Number(form.queueNumber)
      : null;

    if (
      queueNumber !== null &&
      (!Number.isInteger(queueNumber) || queueNumber < 1)
    ) {
      setError('Queue number must be a positive whole number.');
      return;
    }

    setSaving(true);

    try {
      if (isPatient && symptomAssessment) {
        const { error: assessmentError } = await supabaseClient
          .from('triage_assessments')
          .insert({
            patient_id: selectedPatientId,
            symptoms: form.symptoms.trim(),
            risk_level: symptomAssessment.riskLevel,
            risk_score: symptomAssessment.riskScore,
            recommendation: symptomAssessment.recommendation,
            created_by: user?.id ?? null,
          });

        if (assessmentError) {
          throw new Error(
            `${t('unableSaveAssessment')} — ${assessmentError.message}`
          );
        }
      }

      const appointmentDate = new Date(
        form.appointmentDate
      ).toISOString();

      const { data: createdAppointment, error: insertError } =
        await supabaseClient
          .from('appointments')
          .insert({
            patient_id: selectedPatientId,
            doctor_id: form.doctorId || null,
            facility_id: form.facilityId || null,
            appointment_date: appointmentDate,
            status: 'scheduled',
            queue_number: queueNumber,
            notes: form.notes.trim() || null,
          })
          .select('*')
          .single();

      if (insertError) {
        throw new Error(
          `Unable to create appointment — ${insertError.message}`
        );
      }

      const appointment = createdAppointment as Appointment;

      await createPatientNotification(
        selectedPatientId,
        'Appointment booked',
        `Your appointment has been booked for ${formatDateTime(
          appointment.appointment_date
        )}.`
      );

      setSuccess(
        isPatient
          ? t('appointmentBookedSuccess')
          : 'Appointment created successfully. The patient has been notified.'
      );

      setForm({
        ...emptyForm,
        patientId: isPatient && myPatient ? myPatient.id : '',
      });
      setSymptomAssessment(null);

      setShowForm(false);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isPatient
            ? t('unableCreateAppointment')
            : 'Unable to create appointment'
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    appointmentId: string,
    status: AppointmentStatus
  ) {
    if (isPatient) return;

    setError('');
    setSuccess('');

    const appointment = appointments.find(
      (item) => item.id === appointmentId
    );

    if (!appointment) {
      setError('Appointment could not be found.');
      return;
    }

    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId);

    if (updateError) {
      setError(
        `Unable to update appointment — ${updateError.message}`
      );
      return;
    }

    setAppointments((current) =>
      current.map((item) =>
        item.id === appointmentId
          ? { ...item, status }
          : item
      )
    );

    await createPatientNotification(
      appointment.patient_id,
      'Appointment status updated',
      `Your appointment status is now "${getStatusLabel(status)}".`
    );

    setSuccess(
      'Appointment status updated and the patient has been notified.'
    );
  }

  function getPatientName(patientId: string) {
    return patientMap.get(patientId)?.full_name || 'Unknown patient';
  }

  function getDoctorName(doctorId: string | null) {
    if (!doctorId) return isPatient ? t('notAssigned') : 'Not assigned';

    return doctorMap.get(doctorId)?.full_name || 'Unknown doctor';
  }

  function getFacilityName(facilityId: string | null) {
    if (!facilityId) return isPatient ? t('notAssigned') : 'Not assigned';

    return facilityMap.get(facilityId)?.name || 'Unknown facility';
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isPatient ? t('myAppointments') : 'Appointments & Queue'}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isPatient
              ? t('bookAndView')
              : 'Manage patient appointments and queue status.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('');
            setSuccess('');

            setForm({
              ...emptyForm,
              patientId: isPatient && myPatient ? myPatient.id : '',
            });

            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {isPatient ? t('bookAppointment') : 'New Appointment'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isPatient
                  ? t('searchAppointments')
                  : 'Search patient, doctor, facility...'
              }
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'all' | AppointmentStatus
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">{isPatient ? t('allStatuses') : 'All statuses'}</option>

            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {isPatient ? patientStatusLabel(status) : getStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isPatient ? t('bookAnAppointment') : 'Create Appointment'}
              </h2>

              <p className="text-sm text-gray-500">
                {isPatient
                  ? t('appointmentSaved')
                  : 'Add an appointment to the Supabase database.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleCreateAppointment}
            className="grid gap-4 md:grid-cols-2"
          >
            {!isPatient && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Patient *
                </label>

                <select
                  value={form.patientId}
                  onChange={(e) =>
                    updateForm('patientId', e.target.value)
                  }
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select patient</option>

                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                      {patient.district
                        ? ` — ${patient.district}`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {isPatient ? t('doctor') : 'Doctor'}
              </label>

              <select
                value={form.doctorId}
                onChange={(e) =>
                  updateForm('doctorId', e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{isPatient ? t('notAssigned') : 'Not assigned'}</option>

                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.full_name || doctor.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {isPatient ? t('facility') : 'Facility'}
              </label>

              <select
                value={form.facilityId}
                onChange={(e) =>
                  updateForm('facilityId', e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{isPatient ? t('notAssigned') : 'Not assigned'}</option>

                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {isPatient ? t('dateAndTime') : 'Appointment Date & Time'} *
              </label>

              <input
                type="datetime-local"
                value={form.appointmentDate}
                onChange={(e) =>
                  updateForm('appointmentDate', e.target.value)
                }
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {!isPatient && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    updateForm(
                      'status',
                      e.target.value as AppointmentStatus
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isPatient && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Queue Number
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.queueNumber}
                  onChange={(e) =>
                    updateForm('queueNumber', e.target.value)
                  }
                  placeholder="e.g. 12"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {isPatient ? t('notes') : 'Notes'}
              </label>

              <textarea
                value={form.notes}
                onChange={(e) =>
                  updateForm('notes', e.target.value)
                }
                rows={3}
                placeholder={isPatient ? t('appointmentNotes') : 'Reason or additional appointment notes...'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {isPatient && (
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('whatSymptoms')} *
                </label>
                <textarea
                  value={form.symptoms}
                  onChange={(e) => {
                    updateForm('symptoms', e.target.value);
                    setSymptomAssessment(null);
                  }}
                  rows={4}
                  required
                  placeholder={t('symptomInstructions')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {t('symptomDisclaimer')}
                </p>
              </div>
            )}

            {isPatient && symptomAssessment && (
              <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {t(symptomAssessment.riskLevel)} {t('risk')}
                  </p>
                  <p>{t('riskScore')}: {symptomAssessment.riskScore}</p>
                </div>
                <p className="mt-2">{patientRecommendation(symptomAssessment.riskLevel)}</p>
                <p className="mt-2 text-xs">
                  {t('medicalDisclaimer')}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {isPatient ? t('cancel') : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? t('saving')
                  : isPatient
                    ? symptomAssessment
                      ? t('confirmAndBook')
                      : t('reviewSymptoms')
                    : 'Create Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {isPatient ? t('appointmentList') : 'Appointment List'}
              </h2>

              <p className="text-sm text-gray-500">
                {filteredAppointments.length} appointment
                {filteredAppointments.length === 1 ? '' : 's'}
              </p>
            </div>

            <CalendarDays className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-6 py-12 text-sm text-gray-500">
            {isPatient ? t('loadingAppointments') : 'Loading appointments...'}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />

            <h3 className="mt-3 font-medium text-gray-900">
              {isPatient
                ? t('noAppointments')
                : 'No appointments found'}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {isPatient
                ? t('bookFirstAppointment')
                : 'Try changing your search or create a new appointment.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-5 transition hover:bg-gray-50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!isPatient && (
                        <h3 className="font-semibold text-gray-900">
                          {getPatientName(appointment.patient_id)}
                        </h3>
                      )}

                      {isPatient && (
                        <h3 className="font-semibold text-gray-900">
                          {t('yourAppointment')}
                        </h3>
                      )}

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          appointment.status
                        )}`}
                      >
                        {patientStatusLabel(appointment.status)}
                      </span>

                      {appointment.queue_number !== null &&
                        appointment.queue_number !== undefined && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            Queue #{appointment.queue_number}
                          </span>
                        )}
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />

                        <span>
                          {formatDateTime(
                            appointment.appointment_date,
                            isPatient ? patientLocale : 'en-IN'
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">
                          {isPatient ? t('doctor') : 'Doctor'}:
                        </span>{' '}
                        {getDoctorName(appointment.doctor_id)}
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">
                          {isPatient ? t('facility') : 'Facility'}:
                        </span>{' '}
                        {getFacilityName(appointment.facility_id)}
                      </div>

                      {appointment.notes && (
                        <div>
                          <span className="font-medium text-gray-700">
                            {isPatient ? t('notes') : 'Notes'}:
                          </span>{' '}
                          {appointment.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isPatient && (
                    <div className="flex items-center gap-2">
                      <select
                        value={appointment.status || ''}
                        onChange={(e) =>
                          void updateStatus(
                            appointment.id,
                            e.target.value as AppointmentStatus
                          )
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}