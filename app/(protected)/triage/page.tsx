'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPlus,
  FileText,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isHealthcareStaff } from '@/lib/auth/roles';
import { supabaseClient } from '@/lib/supabase/client';
import type { Patient, TriageAssessment } from '@/lib/types/database';
import {
  assessSymptoms,
  type AssessmentRiskLevel,
  type SymptomAssessmentResult,
} from '@/lib/triage/symptom-assessment';
import { usePatientLanguage } from '@/lib/i18n/patient-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RiskFilter = 'all' | AssessmentRiskLevel;

type TriageForm = {
  patientId: string;
  symptoms: string;
  riskLevel: AssessmentRiskLevel | '';
  riskScore: string;
  recommendation: string;
};

const emptyForm: TriageForm = {
  patientId: '',
  symptoms: '',
  riskLevel: '',
  riskScore: '',
  recommendation: '',
};

const riskOptions: { value: AssessmentRiskLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'emergency', label: 'Emergency' },
];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function riskLabel(value: string | null) {
  return riskOptions.find((option) => option.value === value)?.label ?? 'Not recorded';
}

function riskClasses(value: string | null) {
  switch (value) {
    case 'emergency':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    case 'high':
      return 'border-warning/40 bg-warning/10 text-warning-foreground';
    case 'medium':
      return 'border-accent/30 bg-accent/10 text-accent';
    default:
      return 'border-success/30 bg-success/10 text-success';
  }
}

function formatSymptoms(value: unknown) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return 'Not recorded';
  return JSON.stringify(value);
}

function AssessmentCard({ assessment, patientName }: { assessment: TriageAssessment; patientName: string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">{patientName}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Assessed {formatDate(assessment.created_at)}</p>
            </div>
          </div>
          <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${riskClasses(assessment.risk_level)}`}>
            {riskLabel(assessment.risk_level)}
          </span>
        </div>
        <div className="mt-5 grid gap-4 border-t border-border/70 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Risk score</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{assessment.risk_score ?? 'Not recorded'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Symptoms</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{formatSymptoms(assessment.symptoms)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommendation</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{assessment.recommendation ?? 'Not recorded'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PatientTriageForm({
  symptoms,
  saving,
  error,
  result,
  onSymptomsChange,
  onSubmit,
}: {
  symptoms: string;
  saving: boolean;
  error: string | null;
  result: SymptomAssessmentResult | null;
  onSymptomsChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { t } = usePatientLanguage();
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader>
          <CardTitle className="text-lg">{t('whatSymptoms')}</CardTitle>
        <CardDescription>
          Describe what you are experiencing. This is a rule-based screening tool, not a diagnosis.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          <Label htmlFor="patient-symptoms">{t('whatSymptoms')}</Label>
          <textarea id="patient-symptoms" required value={symptoms} onChange={(event) => onSymptomsChange(event.target.value)} rows={5} className="flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="For example: fever, headache, and weakness" />
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('reviewSymptoms')}</Button>
          {result && (
            <div className={`rounded-md border p-4 ${riskClasses(result.riskLevel)}`} role="status">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{riskLabel(result.riskLevel)} risk</p>
                <p className="text-sm font-semibold">Risk score: {result.riskScore}</p>
              </div>
              <p className="mt-2 text-sm">{result.recommendation}</p>
              <p className="mt-3 text-xs font-medium">This is not a medical diagnosis. Seek professional medical care, especially if symptoms worsen or you feel unsafe.</p>
            </div>
          )}
        </CardContent>
      </form>
    </Card>
  );
}

function TriageForm({
  patients,
  form,
  saving,
  error,
  onChange,
  onSubmit,
  onCancel,
}: {
  patients: Patient[];
  form: TriageForm;
  saving: boolean;
  error: string | null;
  onChange: (field: keyof TriageForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-border/70">
        <div>
          <CardTitle className="text-lg">New triage assessment</CardTitle>
          <CardDescription className="mt-1">Enter values confirmed by the healthcare professional.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Close triage form"><X className="h-4 w-4" /></Button>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-5 pt-6">
          {error && <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
          <div className="space-y-2">
            <Label htmlFor="triage-patient">Patient <span className="text-destructive">*</span></Label>
            <select id="triage-patient" required value={form.patientId} onChange={(event) => onChange('patientId', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select an existing patient</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="triage-symptoms">Symptoms / chief complaint <span className="text-destructive">*</span></Label>
            <textarea id="triage-symptoms" required value={form.symptoms} onChange={(event) => onChange('symptoms', event.target.value)} rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Record the patient's reported symptoms or chief complaint" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="triage-risk">Risk level <span className="text-destructive">*</span></Label>
              <select id="triage-risk" required value={form.riskLevel} onChange={(event) => onChange('riskLevel', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select confirmed level</option>
                {riskOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="triage-score">Risk score <span className="text-destructive">*</span></Label>
              <Input id="triage-score" required type="number" min="0" step="any" value={form.riskScore} onChange={(event) => onChange('riskScore', event.target.value)} placeholder="Enter confirmed score" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="triage-recommendation">Recommendation <span className="text-destructive">*</span></Label>
            <textarea id="triage-recommendation" required value={form.recommendation} onChange={(event) => onChange('recommendation', event.target.value)} rows={4} className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Record the professional's recommendation" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">This form records professional-entered information. It does not calculate risk or provide an autonomous clinical decision.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save assessment</Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

export default function TriagePage() {
  const { user, role } = useAuth();
  const { t } = usePatientLanguage();
  const [assessments, setAssessments] = useState<TriageAssessment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSymptoms, setPatientSymptoms] = useState('');
  const [patientResult, setPatientResult] = useState<ReturnType<typeof assessSymptoms> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [form, setForm] = useState<TriageForm>(emptyForm);
  const canCreate = isHealthcareStaff(role);
  const isPatient = role === 'patient';

  const loadData = async () => {
    setLoading(true);
    setError(null);

    if (isPatient && user) {
      const { data: patientData, error: patientError } = await supabaseClient
        .from('patients')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (patientError || !patientData) {
        setError(patientError?.message ?? 'Your patient profile is not connected yet. Please contact the administrator.');
        setLoading(false);
        return;
      }

      const patient = patientData as Pick<Patient, 'id'>;

      const { data: patientAssessments, error: assessmentError } = await supabaseClient
        .from('triage_assessments')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (assessmentError) {
        setError(assessmentError.message);
      } else {
        setPatients([patientData as Patient]);
        setAssessments((patientAssessments ?? []) as TriageAssessment[]);
      }
      setLoading(false);
      return;
    }

    const [assessmentResult, patientResult] = await Promise.all([
      supabaseClient.from('triage_assessments').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('patients').select('*').order('full_name', { ascending: true }),
    ]);
    if (assessmentResult.error || patientResult.error) {
      setError(assessmentResult.error?.message ?? patientResult.error?.message ?? 'Unable to load triage data.');
    } else {
      setAssessments((assessmentResult.data ?? []) as TriageAssessment[]);
      setPatients((patientResult.data ?? []) as Patient[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) void loadData();
  }, [user, isPatient]);

  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.full_name])), [patients]);
  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assessments.filter((assessment) => {
      const matchesSearch = !query || patientNames.get(assessment.patient_id)?.toLowerCase().includes(query);
      const matchesRisk = riskFilter === 'all' || assessment.risk_level === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [assessments, patientNames, riskFilter, search]);

  const updateField = (field: keyof TriageForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const saveAssessment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !canCreate) return;
    setSaving(true);
    setFormError(null);
    setNotice(null);
    if (!form.patientId || !form.symptoms.trim() || !form.riskLevel || !form.riskScore || !form.recommendation.trim()) {
      setFormError('Complete all assessment fields before saving.');
      setSaving(false);
      return;
    }
    const riskScore = Number(form.riskScore);
    if (!Number.isFinite(riskScore) || riskScore < 0) {
      setFormError('Enter a valid non-negative risk score.');
      setSaving(false);
      return;
    }
    const { error: saveError } = await supabaseClient.from('triage_assessments').insert({
      patient_id: form.patientId,
      symptoms: form.symptoms.trim(),
      risk_level: form.riskLevel,
      risk_score: riskScore,
      recommendation: form.recommendation.trim(),
      created_by: user.id,
    });
    if (saveError) {
      setFormError(saveError.message);
    } else {
      setNotice('Triage assessment saved successfully.');
      setForm(emptyForm);
      setFormOpen(false);
      await loadData();
    }
    setSaving(false);
  };

  const savePatientAssessment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !isPatient) return;

    const symptoms = patientSymptoms.trim();
    if (!symptoms) return;

    setSaving(true);
    setError(null);
    const { data: patientData, error: patientError } = await supabaseClient
      .from('patients')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (patientError || !patientData) {
      setError(patientError?.message ?? 'Your patient profile is not connected yet.');
      setSaving(false);
      return;
    }

    const patient = patientData as Pick<Patient, 'id'>;
    const result = assessSymptoms(symptoms);
    const { error: saveError } = await supabaseClient.from('triage_assessments').insert({
      patient_id: patient.id,
      symptoms,
      risk_level: result.riskLevel,
      risk_score: result.riskScore,
      recommendation: result.recommendation,
      created_by: user.id,
    });

    if (saveError) {
      setError(saveError.message);
    } else {
      setPatientResult(result);
      setPatientSymptoms('');
      await loadData();
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">{isPatient ? t('triage') : 'Clinical workflow'}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{isPatient ? t('triage') : 'Digital Triage'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{isPatient ? 'Review your symptom assessment history and seek professional care when needed.' : 'Record and review professional-confirmed triage assessments for existing patients.'}</p>
        </div>
        {canCreate && <Button type="button" onClick={() => { setFormError(null); setNotice(null); setFormOpen(true); }}><ClipboardPlus className="mr-2 h-4 w-4" />New assessment</Button>}
      </div>

      {notice && <div className="mb-6 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success" role="status"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
      {!canCreate && !isPatient && <div className="mb-6 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />You have read-only access to triage assessments. Healthcare staff and doctors can record new assessments.</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <section className="min-w-0 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-semibold text-foreground">{isPatient ? t('healthRecords') : 'Assessment history'}</h2><p className="text-sm text-muted-foreground">{loading ? t('loading') : `${filteredAssessments.length} assessment${filteredAssessments.length === 1 ? '' : 's'} shown`}</p></div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="relative sm:w-56"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by patient" className="pl-9" aria-label="Search triage by patient" /></div>
              <div className="relative sm:w-40"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as RiskFilter)} className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Filter by risk level"><option value="all">All risk levels</option>{riskOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
            </div>
          </div>

          {error && <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">{isPatient ? t('error') : 'Unable to load triage data'}</p><p className="mt-1">{error}</p><Button type="button" variant="outline" size="sm" onClick={() => void loadData()} className="mt-3">{isPatient ? t('tryAgain') : 'Try again'}</Button></div></div>}
          {loading && !error && <div className="flex min-h-48 items-center justify-center rounded-lg border border-border/70 bg-card"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2 text-sm text-muted-foreground">Loading assessments...</span></div>}
          {!loading && !error && filteredAssessments.length === 0 && <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center"><Stethoscope className="h-8 w-8 text-muted-foreground/60" /><h3 className="mt-3 font-semibold text-foreground">{search || riskFilter !== 'all' ? 'No matching assessments' : 'No triage assessments yet'}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{search || riskFilter !== 'all' ? 'Try changing the patient search or risk filter.' : isPatient ? 'Submit your symptoms to create your first assessment.' : canCreate ? 'Record a professional-confirmed assessment to begin the history.' : 'Assessments available to your account will appear here.'}</p></div>}
          {!loading && !error && filteredAssessments.length > 0 && <div className="space-y-4">{filteredAssessments.map((assessment) => <AssessmentCard key={assessment.id} assessment={assessment} patientName={patientNames.get(assessment.patient_id) ?? 'Patient record unavailable'} />)}</div>}
        </section>
        {isPatient && <PatientTriageForm symptoms={patientSymptoms} saving={saving} error={error} result={patientResult} onSymptomsChange={setPatientSymptoms} onSubmit={savePatientAssessment} />}
        {formOpen && canCreate && <TriageForm patients={patients} form={form} saving={saving} error={formError} onChange={updateField} onSubmit={saveAssessment} onCancel={() => { if (!saving) { setFormOpen(false); setFormError(null); } }} />}
        {!formOpen && canCreate && <Card className="hidden self-start border-dashed border-border/80 bg-card/50 lg:block"><CardContent className="flex flex-col items-center px-6 py-12 text-center"><FileText className="h-8 w-8 text-primary/70" /><h2 className="mt-4 font-semibold text-foreground">Professional assessment entry</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Risk level, score, and recommendation are recorded exactly as entered by the healthcare professional.</p><Button type="button" variant="outline" onClick={() => setFormOpen(true)} className="mt-5"><ClipboardPlus className="mr-2 h-4 w-4" />New assessment</Button></CardContent></Card>}
      </div>
    </div>
  );
}