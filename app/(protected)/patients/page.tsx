'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isHealthcareStaff } from '@/lib/auth/roles';
import { supabaseClient } from '@/lib/supabase/client';
import { OFFLINE_STORES, getCachedRecords, replaceCachedRecords, saveOutboxItem, saveRecord } from '@/lib/offline/indexed-db';
import { syncPendingPatientAppointments } from '@/lib/offline/appointment-sync';
import type { Patient } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePatientLanguage } from '@/lib/i18n/patient-language';

type PatientForm = {
  full_name: string;
  date_of_birth: string;
  gender: '' | Exclude<Patient['gender'], null>;
  phone: string;
  address: string;
  district: string;
  region: string;
  national_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const emptyForm: PatientForm = {
  full_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  address: '',
  district: '',
  region: '',
  national_id: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

function createLocalId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toForm(patient: Patient): PatientForm {
  return {
    full_name: patient.full_name,
    date_of_birth: patient.date_of_birth ?? '',
    gender: patient.gender ?? '',
    phone: patient.phone ?? '',
    address: patient.address ?? '',
    district: patient.district ?? '',
    region: patient.region ?? '',
    national_id: patient.national_id ?? '',
    emergency_contact_name: patient.emergency_contact_name ?? '',
    emergency_contact_phone: patient.emergency_contact_phone ?? '',
  };
}

function displayValue(value: string | null) {
  return value?.trim() || 'Not provided';
}

function formatDate(value: string | null) {
  if (!value) return 'Date of birth not provided';

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

function PatientFormPanel({
  form,
  editing,
  saving,
  error,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: PatientForm;
  editing: boolean;
  saving: boolean;
  error: string | null;
  onChange: (field: keyof PatientForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const field = (name: keyof PatientForm) => ({
    value: form[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      onChange(name, event.target.value),
  });

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-border/70">
        <div>
          <CardTitle className="text-lg">
            {editing ? 'Edit patient details' : 'Register patient'}
          </CardTitle>

          <CardDescription className="mt-1">
            {editing
              ? 'Update your patient information and keep your record accurate.'
              : 'Keep the patient record accurate and up to date.'}
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Close patient form"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-5 pt-6">
          {error && (
            <div
              className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input id="full_name" required autoFocus {...field('full_name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of birth</Label>
              <Input id="date_of_birth" type="date" {...field('date_of_birth')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={form.gender}
                onChange={(event) => onChange('gender', event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" {...field('phone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="national_id">National ID</Label>
              <Input id="national_id" {...field('national_id')} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...field('address')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input id="district" {...field('district')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input id="region" {...field('region')} />
            </div>
          </div>

          <div className="border-t border-border/70 pt-5">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Emergency contact
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">
                  Contact name
                </Label>
                <Input
                  id="emergency_contact_name"
                  {...field('emergency_contact_name')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">
                  Contact phone
                </Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  {...field('emergency_contact_phone')}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {editing ? 'Save changes' : 'Register patient'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

function PatientCard({
  patient,
  canEdit,
  onEdit,
}: {
  patient: Patient;
  canEdit: boolean;
  onEdit: (patient: Patient) => void;
}) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/patients/${patient.id}`}
            className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">
                {patient.full_name}
              </h3>

              <p className="text-xs text-muted-foreground">
                {formatDate(patient.date_of_birth)}
              </p>
            </div>
          </Link>

          {canEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(patient)}
              aria-label={`Edit ${patient.full_name}`}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2 text-muted-foreground">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              {patient.gender
                ? patient.gender.charAt(0).toUpperCase() +
                  patient.gender.slice(1)
                : 'Gender not provided'}
            </span>
          </div>

          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              {displayValue(patient.district)}
              {patient.region ? `, ${patient.region}` : ''}
            </span>
          </div>

          <div className="flex items-start gap-2 text-muted-foreground">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{displayValue(patient.phone)}</span>
          </div>

          <div className="flex items-start gap-2 text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              {displayValue(patient.emergency_contact_name)}
              {patient.emergency_contact_phone
                ? ` · ${patient.emergency_contact_phone}`
                : ''}
            </span>
          </div>
        </div>

        <div className="mt-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          Blood group is not part of the patient registration record.
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatientsPage() {
  const { user, role } = useAuth();
  const { t } = usePatientLanguage();
  const searchParams = useSearchParams();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const canManagePatients = isHealthcareStaff(role);
  const canEditOwnProfile = role === 'patient';

  const editId = searchParams.get('edit');

  const loadPatients = async () => {
    setLoading(true);
    setLoadError(null);

    if (!navigator.onLine) {
      try {
        const cached = await getCachedRecords<Patient>(OFFLINE_STORES.patient_cache);
        setPatients(cached.filter((patient) => role === 'admin' || role === 'doctor' || (role === 'patient' && patient.profile_id === user?.id) || (role === 'health_worker' && patient.assigned_health_worker_id === user?.id)));
      } catch {
        setPatients([]);
        setLoadError('Offline patient records are not available in the local cache yet.');
      }
      setLoading(false);
      return;
    }

    let patientQuery = supabaseClient.from('patients').select('*').order('created_at', { ascending: false });
    if (role === 'patient') patientQuery = patientQuery.eq('profile_id', user?.id ?? '');
    if (role === 'health_worker') patientQuery = patientQuery.eq('assigned_health_worker_id', user?.id ?? '');
    const { data, error } = await patientQuery;

    if (error) {
      try {
        const cached = await getCachedRecords<Patient>(OFFLINE_STORES.patient_cache);
        setPatients(cached.filter((patient) => role === 'admin' || role === 'doctor' || (role === 'patient' && patient.profile_id === user?.id) || (role === 'health_worker' && patient.assigned_health_worker_id === user?.id)));
      } catch {
        setPatients([]);
      }
      setLoadError(error.message);
    } else {
      const patientList = (data ?? []) as Patient[];
      setPatients(patientList);
      try {
        await replaceCachedRecords(OFFLINE_STORES.patient_cache, patientList);
      } catch {
        // Keep the online session working even if the cache write fails.
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      void loadPatients();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && editId && canManagePatients && !formOpen) {
      const patientToEdit = patients.find(
        (patient) => patient.id === editId
      );

      if (patientToEdit) {
        openEditForm(patientToEdit);
      }
    }
  }, [canManagePatients, editId, formOpen, loading, patients]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return patients;

    return patients.filter((patient) =>
      [
        patient.full_name,
        patient.phone,
        patient.district,
        patient.region,
        patient.national_id,
      ].some((value) => value?.toLowerCase().includes(query))
    );
  }, [patients, search]);

  const openCreateForm = () => {
    setEditingPatient(null);
    setForm(emptyForm);
    setFormError(null);
    setNotice(null);
    setFormOpen(true);
  };

  const openEditForm = (patient: Patient) => {
    if (
      !canManagePatients &&
      (!canEditOwnProfile || patient.profile_id !== user?.id)
    ) {
      setFormError('You can only edit your own patient details.');
      return;
    }

    setEditingPatient(patient);
    setForm(toForm(patient));
    setFormError(null);
    setNotice(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingPatient(null);
    setFormError(null);
  };

  const updateField = (field: keyof PatientForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const savePatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || (!canManagePatients && !canEditOwnProfile)) {
      return;
    }

    if (editingPatient && !canManagePatients) {
      if (editingPatient.profile_id !== user.id) {
        setFormError('You can only edit your own patient details.');
        return;
      }
    }

    if (!editingPatient && !canManagePatients) {
      setFormError('Patients can only edit their existing profile.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setNotice(null);

    const values = {
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      district: form.district.trim() || null,
      region: form.region.trim() || null,
      national_id: form.national_id.trim() || null,
      emergency_contact_name:
        form.emergency_contact_name.trim() || null,
      emergency_contact_phone:
        form.emergency_contact_phone.trim() || null,
    };

    if (!values.full_name) {
      setFormError('Full name is required.');
      setSaving(false);
      return;
    }

    if (editingPatient && !navigator.onLine) {
      const now = new Date().toISOString();
      const updatedPatient: Patient = {
        ...editingPatient,
        ...values,
        updated_at: now,
      };

      try {
        await saveRecord(OFFLINE_STORES.patient_cache, updatedPatient);
        await saveOutboxItem({
          localOperationId: createLocalId(),
          operationType: 'update',
          resource: 'patients',
          ownerId: user.id,
          payload: updatedPatient,
          createdAt: now,
          retryCount: 0,
          syncStatus: 'pending',
        });
        setPatients((current) => current.map((patient) => (
          patient.id === updatedPatient.id ? updatedPatient : patient
        )));
        setNotice('Patient information saved offline. It will sync automatically when internet connection is restored.');
        setFormOpen(false);
        setEditingPatient(null);
        setForm(emptyForm);
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Unable to save the patient update offline.');
      }
      setSaving(false);
      return;
    }

    const result = editingPatient
      ? await supabaseClient
          .from('patients')
          .update(values as never)
          .eq('id', editingPatient.id)
      : await supabaseClient
          .from('patients')
          .insert(values as never);

    if (result.error) {
      setFormError(result.error.message);
    } else {
      if (editingPatient) {
        const updatedPatient = { ...editingPatient, ...values, updated_at: new Date().toISOString() };
        await saveRecord(OFFLINE_STORES.patient_cache, updatedPatient);
      }
      setNotice(
        editingPatient
          ? 'Patient information updated successfully.'
          : 'Patient registered successfully.'
      );

      setFormOpen(false);
      setEditingPatient(null);
      setForm(emptyForm);

      await loadPatients();
      if (navigator.onLine && user) {
        void syncPendingPatientAppointments(user.id);
      }
    }

    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
            Care coordination
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {canEditOwnProfile ? t('profile') : 'Patients'}
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {canEditOwnProfile
              ? t('personalInformation')
              : 'View and maintain patient registration records available to your account.'}
          </p>
        </div>

        {canManagePatients && (
          <Button
            type="button"
            onClick={openCreateForm}
            className="shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Register patient
          </Button>
        )}
      </div>

      {notice && (
        <div
          className="mb-6 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      {canEditOwnProfile && (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          <Edit3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          You can edit your own patient details. Other patient records are not
          available to your account.
        </div>
      )}

      {canManagePatients && (
        <div className="mb-6 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Healthcare staff and administrators can register and edit patient
          records according to their permissions.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <section className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {canEditOwnProfile ? t('profile') : 'Patient directory'}
              </h2>

              <p className="text-sm text-muted-foreground">
                {loading
                  ? 'Loading records...'
                  : `${filteredPatients.length} patient${
                      filteredPatients.length === 1 ? '' : 's'
                    } shown`}
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  canEditOwnProfile
                    ? t('search')
                    : 'Search patients'
                }
                className="pl-9"
                aria-label="Search patients"
              />
            </div>
          </div>

          {loadError && (
            <div
              className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">Unable to load patients</p>

                <p className="mt-1">{loadError}</p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadPatients()}
                  className="mt-3"
                >
                  Try again
                </Button>
              </div>
            </div>
          )}

          {loading && !loadError && (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-border/70 bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />

              <span className="ml-2 text-sm text-muted-foreground">
                Loading patient records...
              </span>
            </div>
          )}

          {!loading &&
            !loadError &&
            filteredPatients.length === 0 && (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center">
                <Users className="h-8 w-8 text-muted-foreground/60" />

                <h3 className="mt-3 font-semibold text-foreground">
                  {search
                    ? 'No matching patients'
                    : 'No patient records yet'}
                </h3>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {search
                    ? 'Try a different search.'
                    : canManagePatients
                      ? 'Register the first patient to begin building the directory.'
                      : 'Your patient record will appear here when it is connected to your account.'}
                </p>
              </div>
            )}

          {!loading &&
            !loadError &&
            filteredPatients.length > 0 && (
              <div className="grid gap-4 xl:grid-cols-2">
                {filteredPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    canEdit={
                      canManagePatients ||
                      (canEditOwnProfile &&
                        patient.profile_id === user?.id)
                    }
                    onEdit={openEditForm}
                  />
                ))}
              </div>
            )}
        </section>

        {formOpen && (
          <PatientFormPanel
            form={form}
            editing={Boolean(editingPatient)}
            saving={saving}
            error={formError}
            onChange={updateField}
            onSubmit={savePatient}
            onCancel={closeForm}
          />
        )}

        {!formOpen && canManagePatients && (
          <Card className="hidden self-start border-dashed border-border/80 bg-card/50 lg:block">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <CalendarDays className="h-8 w-8 text-primary/70" />

              <h2 className="mt-4 font-semibold text-foreground">
                Patient registration
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Use the registration form to add a patient record. Existing RLS
                policies determine whether your account can save changes.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={openCreateForm}
                className="mt-5"
              >
                <Plus className="mr-2 h-4 w-4" />
                Register patient
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}