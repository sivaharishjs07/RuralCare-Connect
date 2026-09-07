'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Children, useEffect, useState, type ReactNode } from 'react';
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
import { usePatientLanguage } from '@/lib/i18n/patient-language';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

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

function valueOrFallback(
  value: string | null | undefined,
  fallback = 'Not provided'
) {
  return value?.trim() || fallback;
}

function formatDate(
  value: string | null | undefined,
  fallback = 'Not provided'
) {
  if (!value) return fallback;

  const date = new Date(
    value.includes('T') ? value : `${value}T00:00:00`
  );

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not provided';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

function formatEnum(value: string | null | undefined) {
  if (!value) return 'Not recorded';

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function StatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  return (
    <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold capitalize text-primary">
      {formatEnum(status)}
    </span>
  );
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof MapPin;
}) {
  return (
    <div className="flex gap-3">
      {Icon && (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      )}

      <div className={!Icon ? 'pl-0' : ''}>
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>

        <dd className="mt-1 text-sm font-medium text-foreground">
          {value}
        </dd>
      </div>
    </div>
  );
}

function SectionEmpty({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof HeartPulse;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />

        <h2 className="text-lg font-semibold text-foreground">
          {title}
        </h2>
      </div>

      <span className="text-xs font-medium text-muted-foreground">
        {count} record{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function RecordList({
  children,
  emptyMessage,
}: {
  children: ReactNode;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-3">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <SectionEmpty message={emptyMessage} />
      )}
    </div>
  );
}

export default function PatientProfilePage() {
  const params = useParams<{ id: string }>();
  const { role } = useAuth();
  const { t } = usePatientLanguage();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [related, setRelated] =
    useState<RelatedRecords>(emptyRelated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedError, setRelatedError] =
    useState<string | null>(null);

  useEffect(() => {
    const patientId = params.id;

    if (!patientId) return;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      setRelatedError(null);

      const patientResult = await supabaseClient
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();

      if (patientResult.error) {
        setError(patientResult.error.message);
        setLoading(false);
        return;
      }

      if (!patientResult.data) {
        setError(
          'This patient record could not be found or is not available to your account.'
        );
        setLoading(false);
        return;
      }

      const currentPatient =
        patientResult.data as Patient;

      setPatient(currentPatient);

      const results = await Promise.all([
        supabaseClient
          .from('health_records')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        supabaseClient
          .from('triage_assessments')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false }),

        supabaseClient
          .from('appointments')
          .select('*')
          .eq('patient_id', patientId)
          .order('appointment_date', { ascending: false }),

        supabaseClient
          .from('referrals')
          .select('*')
          .eq('patient_id', patientId)
          .order('referral_date', { ascending: false }),

        supabaseClient
          .from('follow_ups')
          .select('*')
          .eq('patient_id', patientId)
          .order('follow_up_date', { ascending: false }),

        currentPatient.assigned_health_worker_id
          ? supabaseClient
              .from('profiles')
              .select('full_name, role')
              .eq(
                'id',
                currentPatient.assigned_health_worker_id
              )
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            }),

        supabaseClient
          .from('facilities')
          .select('*')
          .order('name', { ascending: true }),

        supabaseClient
          .from('profiles')
          .select('id, full_name, role')
          .in('role', [
            'health_worker',
            'doctor',
            'admin',
          ])
          .order('full_name', {
            ascending: true,
          }),
      ]);

      const failedResult = results.find(
        (result) => result.error
      );

      if (failedResult?.error) {
        setRelatedError(
          failedResult.error.message
        );
      }

      setRelated({
        healthRecords:
          (results[0].data ?? []) as HealthRecord[],

        triageAssessments:
          (results[1].data ?? []) as TriageAssessment[],

        appointments:
          (results[2].data ?? []) as Appointment[],

        referrals:
          (results[3].data ?? []) as Referral[],

        followUps:
          (results[4].data ?? []) as FollowUp[],

        assignedWorker:
          results[5].data as Pick<
            Profile,
            'full_name' | 'role'
          > | null,

        facilities:
          (results[6].data ?? []) as Facility[],

        assignedProfiles:
          (results[7].data ?? []) as Pick<
            Profile,
            'id' | 'full_name' | 'role'
          >[],
      });

      setLoading(false);
    };

    void loadProfile();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Loading patient profile...
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Unable to open patient profile
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {error ??
            'The requested patient record is unavailable.'}
        </p>

        <Button asChild variant="outline" className="mt-6">
          <Link href="/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Link>
        </Button>
      </div>
    );
  }

  const canEdit = isHealthcareStaff(role);

  const address = [
    patient.address,
    patient.district,
    patient.region,
  ]
    .filter(Boolean)
    .join(', ');

  const facilityNames = new Map(
    related.facilities.map((facility) => [
      facility.id,
      facility.name,
    ])
  );

  const assignedProfileNames = new Map(
    related.assignedProfiles.map((profile) => [
      profile.id,
      profile.full_name,
    ])
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          className="-ml-2"
        >
          <Link href="/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Link>
        </Button>

        {canEdit && (
          <Button asChild>
            <Link href={`/patients?edit=${patient.id}`}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Patient
            </Link>
          </Button>
        )}
      </div>

      <Card className="overflow-hidden border-primary/15">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserRound className="h-8 w-8" />
              </div>

              <div>
                <p className="text-sm font-medium text-primary">
                  {t('profile')}
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {patient.full_name}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Patient ID: {patient.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
              <span className="text-muted-foreground">
                Created
              </span>

              <span className="font-medium text-foreground">
                {formatDateTime(patient.created_at)}
              </span>

              <span className="text-muted-foreground">
                Updated
              </span>

              <span className="font-medium text-foreground">
                {formatDateTime(patient.updated_at)}
              </span>
            </div>
          </div>
        </div>

        <CardContent className="p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              label={t('dateOfBirth')}
              value={formatDate(patient.date_of_birth)}
              icon={CalendarDays}
            />

            <DetailItem
              label={t('gender')}
              value={formatEnum(patient.gender)}
              icon={Users}
            />

            <DetailItem
              label={t('phone')}
              value={valueOrFallback(patient.phone)}
              icon={Phone}
            />

            <DetailItem
              label={t('address')}
              value={valueOrFallback(address)}
              icon={MapPin}
            />

            <DetailItem
              label={t('emergencyContact')}
              value={valueOrFallback(
                patient.emergency_contact
              )}
              icon={ShieldAlert}
            />

            <DetailItem
              label="Assigned health worker"
              value={
                related.assignedWorker
                  ? `${related.assignedWorker.full_name} (${ROLE_LABELS[related.assignedWorker.role]})`
                  : 'Not assigned'
              }
              icon={Stethoscope}
            />

            <DetailItem
              label="National ID"
              value={valueOrFallback(
                patient.national_id
              )}
            />

            <DetailItem
              label="Region"
              value={valueOrFallback(patient.region)}
            />
          </div>
        </CardContent>
      </Card>

      {relatedError && (
        <div
          className="mt-6 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>
            Some related records could not be loaded:{' '}
            {relatedError}
          </span>
        </div>
      )}

      <Tabs defaultValue="health" className="mt-8">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="health">
            Health records
          </TabsTrigger>

          <TabsTrigger value="triage">
            Triage
          </TabsTrigger>

          <TabsTrigger value="appointments">
            Appointments
          </TabsTrigger>

          <TabsTrigger value="referrals">
            Referrals
          </TabsTrigger>

          <TabsTrigger value="followups">
            Follow-ups
          </TabsTrigger>
        </TabsList>

        {/* HEALTH RECORDS */}
        <TabsContent value="health">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={HeartPulse}
                title={t('healthRecords')}
                count={related.healthRecords.length}
              />

              <CardDescription>
                Clinical records associated with this patient.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <RecordList
                emptyMessage="No health records are available for this patient."
              >
                {related.healthRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-lg border border-border/70 p-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem
                        label="Record type"
                        value={formatEnum(
                          record.record_type
                        )}
                      />

                      <DetailItem
                        label="Diagnosis"
                        value={valueOrFallback(
                          record.diagnosis
                        )}
                      />

                      <DetailItem
                        label="Recorded"
                        value={formatDateTime(
                          record.created_at
                        )}
                      />
                    </div>

                    {record.notes && (
                      <div className="mt-4 border-t border-border/70 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Notes
                        </p>

                        <p className="mt-1 text-sm text-foreground">
                          {record.notes}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 border-t border-border/70 pt-4">
                      <DetailItem
                        label="Facility"
                        value={
                          record.facility_id
                            ? facilityNames.get(
                                record.facility_id
                              ) ??
                              'Facility unavailable'
                            : 'Not assigned'
                        }
                      />
                    </div>
                  </div>
                ))}
              </RecordList>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRIAGE */}
        <TabsContent value="triage">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={ShieldAlert}
                title="Triage assessments"
                count={
                  related.triageAssessments.length
                }
              />

              <CardDescription>
                Risk level, symptoms, scores, and
                recommendations recorded during triage.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <RecordList
                emptyMessage="No triage assessments are available for this patient."
              >
                {related.triageAssessments.map(
                  (assessment) => (
                    <div
                      key={assessment.id}
                      className="rounded-lg border border-border/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-foreground">
                            Risk level
                          </span>

                          <StatusBadge
                            status={
                              assessment.risk_level
                            }
                          />
                        </div>

                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(
                            assessment.created_at
                          )}
                        </span>
                      </div>

                      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                        <DetailItem
                          label="Risk score"
                          value={
                            assessment.risk_score !==
                            null &&
                            assessment.risk_score !==
                              undefined
                              ? String(
                                  assessment.risk_score
                                )
                              : 'Not recorded'
                          }
                        />

                        <DetailItem
                          label="Recommendation"
                          value={valueOrFallback(
                            assessment.recommendation
                          )}
                        />

                        <DetailItem
                          label="Recorded"
                          value={formatDateTime(
                            assessment.created_at
                          )}
                        />
                      </dl>

                      <div className="mt-4 border-t border-border/70 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Symptoms
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                          {assessment.symptoms
                            ? JSON.stringify(
                                assessment.symptoms,
                                null,
                                2
                              )
                            : 'No symptoms recorded'}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </RecordList>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APPOINTMENTS */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={CalendarDays}
                title={t('appointments')}
                count={related.appointments.length}
              />

              <CardDescription>
                Scheduled and completed appointment
                records.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <RecordList
                emptyMessage="No appointments are available for this patient."
              >
                {related.appointments.map(
                  (appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-lg border border-border/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Clock3 className="h-4 w-4 text-primary" />

                          <span className="font-semibold text-foreground">
                            {formatDateTime(
                              appointment.appointment_date
                            )}
                          </span>
                        </div>

                        <StatusBadge
                          status={appointment.status}
                        />
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <DetailItem
                          label="Reason / Notes"
                          value={valueOrFallback(
                            appointment.notes
                          )}
                        />

                        <DetailItem
                          label="Queue number"
                          value={
                            appointment.queue_number !==
                              null &&
                            appointment.queue_number !==
                              undefined
                              ? String(
                                  appointment.queue_number
                                )
                              : 'Not assigned'
                          }
                        />

                        <DetailItem
                          label="Appointment date"
                          value={formatDateTime(
                            appointment.appointment_date
                          )}
                        />
                      </div>
                    </div>
                  )
                )}
              </RecordList>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REFERRALS */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={ClipboardList}
                title={t('referrals')}
                count={related.referrals.length}
              />

              <CardDescription>
                Referral status, destination, priority,
                and completion tracking.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <RecordList
                emptyMessage="No referrals are available for this patient."
              >
                {related.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="rounded-lg border border-border/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {valueOrFallback(
                            referral.reason
                          )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Referred{' '}
                          {formatDateTime(
                            referral.referral_date
                          )}
                        </p>
                      </div>

                      <StatusBadge
                        status={referral.status}
                      />
                    </div>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem
                        label="Source facility"
                        value={
                          (referral.source_facility_id
                            ? facilityNames.get(
                                referral.source_facility_id
                              )
                            : undefined) ??
                          'Source facility unavailable'
                        }
                      />

                      <DetailItem
                        label="Destination"
                        value={
                          (referral.destination_facility_id
                            ? facilityNames.get(
                                referral.destination_facility_id
                              )
                            : undefined) ??
                          'Destination facility unavailable'
                        }
                      />

                      <DetailItem
                        label="Priority"
                        value={formatEnum(
                          referral.priority
                        )}
                      />

                      <DetailItem
                        label="Reason"
                        value={valueOrFallback(
                          referral.reason
                        )}
                      />

                      <DetailItem
                        label="Expected visit"
                        value={formatDateTime(
                          referral.expected_visit_date
                        )}
                      />

                      <DetailItem
                        label="Completed"
                        value={formatDateTime(
                          referral.completed_at
                        )}
                      />
                    </dl>
                  </div>
                ))}
              </RecordList>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOLLOW-UPS */}
        <TabsContent value="followups">
          <Card>
            <CardHeader>
              <SectionHeader
                icon={CheckCircle2}
                title={t('followUps')}
                count={related.followUps.length}
              />

              <CardDescription>
                Follow-up dates, status, priority, and
                care notes.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <RecordList
                emptyMessage="No follow-ups are available for this patient."
              >
                {related.followUps.map((followUp) => {
                  const relatedReferral =
                    related.referrals.find(
                      (referral) =>
                        referral.id ===
                        followUp.referral_id
                    );

                  return (
                    <div
                      key={followUp.id}
                      className="rounded-lg border border-border/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-4 w-4 text-primary" />

                          <span className="font-semibold text-foreground">
                            {formatDate(
                              followUp.follow_up_date
                            )}
                          </span>
                        </div>

                        <StatusBadge
                          status={followUp.status}
                        />
                      </div>

                      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailItem
                          label="Follow-up date"
                          value={formatDateTime(
                            followUp.follow_up_date
                          )}
                        />

                        <DetailItem
                          label="Priority"
                          value={formatEnum(
                            followUp.priority
                          )}
                        />

                        <DetailItem
                          label="Assigned worker"
                          value={
                            followUp.health_worker_id
                              ? assignedProfileNames.get(
                                  followUp.health_worker_id
                                ) ??
                                'Worker unavailable'
                              : 'Not assigned'
                          }
                        />

                        <DetailItem
                          label="Related referral"
                          value={
                            relatedReferral
                              ? valueOrFallback(
                                  relatedReferral.reason
                                )
                              : 'No related referral'
                          }
                        />

                        <DetailItem
                          label="Notes"
                          value={valueOrFallback(
                            followUp.notes
                          )}
                        />

                        <DetailItem
                          label="Created"
                          value={formatDateTime(
                            followUp.created_at
                          )}
                        />
                      </dl>
                    </div>
                  );
                })}
              </RecordList>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}