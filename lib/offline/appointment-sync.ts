import { supabaseClient } from '@/lib/supabase/client';
import {
  deleteRecord,
  getAllOutboxItems,
  saveOutboxItem,
  saveRecord,
} from '@/lib/offline/indexed-db';
import type { OutboxItem } from '@/lib/offline/types';

export type PendingPatientTriage = {
  id: string;
  patient_id: string;
  symptoms: string;
  risk_level: 'low' | 'medium' | 'high' | 'emergency';
  risk_score: number;
  recommendation: string;
  created_by: string;
};

export type PendingPatientAppointment = {
  id: string;
  patient_id: string;
  doctor_id: string;
  facility_id: string;
  appointment_date: string;
  status: 'scheduled';
  queue_number: null;
  notes: null;
};

export type PendingHealthRecord = {
  id: string;
  patient_id: string;
  facility_id: string | null;
  record_type: string | null;
  diagnosis: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  current_medications: string[] | null;
  notes: string | null;
  recorded_by: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PatientAppointmentOutboxPayload =
  | PendingPatientTriage
  | PendingPatientAppointment
  | PendingHealthRecord;

type PendingPatientUpdate = {
  id: string;
  profile_id: string | null;
  full_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  phone: string | null;
  address: string | null;
  district: string | null;
  region: string | null;
  national_id: string | null;
  emergency_contact: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  assigned_health_worker_id: string | null;
  facility_id: string | null;
  created_at: string;
  updated_at: string;
};

type OutboxPayload = PatientAppointmentOutboxPayload | PendingPatientUpdate;

const SYNCABLE_RESOURCES = new Set(['triage_assessments', 'appointments', 'health_records', 'patients']);

let syncPromise: Promise<number> | null = null;

function isPendingItemForUser(item: OutboxItem, userId: string) {
  const validOperation = item.resource === 'patients'
    ? item.operationType === 'update'
    : item.operationType === 'insert';
  if (!SYNCABLE_RESOURCES.has(item.resource) || !validOperation) {
    return false;
  }

  return item.ownerId === userId;
}

async function rowExists(resource: 'triage_assessments' | 'appointments' | 'health_records', id: string) {
  const result = resource === 'triage_assessments'
    ? await supabaseClient.from('triage_assessments').select('id').eq('id', id).maybeSingle()
    : resource === 'appointments'
      ? await supabaseClient.from('appointments').select('id').eq('id', id).maybeSingle()
      : await supabaseClient.from('health_records').select('id').eq('id', id).maybeSingle();

  return !result.error && Boolean(result.data);
}

async function sendItem(item: OutboxItem) {
  const payload = item.payload as OutboxPayload;

  if (item.resource === 'patients') {
    const patient = payload as PendingPatientUpdate;
    const { error } = await supabaseClient
      .from('patients')
      .update(patient as never)
      .eq('id', patient.id);
    if (error) throw error;
    await saveRecord('patient_cache', patient);
    return;
  }

  if (item.resource === 'triage_assessments') {
    const { error } = await supabaseClient
      .from('triage_assessments')
      .insert(payload as never);
    if (error && !(await rowExists('triage_assessments', (payload as PendingPatientTriage).id))) {
      throw error;
    }
    return;
  }

  if (item.resource === 'appointments') {
    const { error } = await supabaseClient
      .from('appointments')
      .insert(payload as never);
    if (error && !(await rowExists('appointments', (payload as PendingPatientAppointment).id))) {
      throw error;
    }
    return;
  }

  const { error } = await supabaseClient
    .from('health_records')
    .insert(payload as never);
  if (error && !(await rowExists('health_records', (payload as PendingHealthRecord).id))) {
    throw error;
  }
}

async function processPendingAppointments(userId: string) {
  const items = (await getAllOutboxItems())
    .filter((item) => isPendingItemForUser(item, userId))
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  let syncedCount = 0;

  for (const item of items) {
    const syncingItem: OutboxItem = { ...item, syncStatus: 'syncing' };
    await saveOutboxItem(syncingItem);

    try {
      await sendItem(syncingItem);
      await deleteRecord('outbox', syncingItem.localOperationId);
      syncedCount += 1;
    } catch {
      await saveOutboxItem({
        ...syncingItem,
        retryCount: syncingItem.retryCount + 1,
        syncStatus: 'failed',
      });
    }
  }

  return syncedCount;
}

export function syncPendingPatientAppointments(userId: string): Promise<number> {
  if (syncPromise) return syncPromise;

  syncPromise = processPendingAppointments(userId).finally(() => {
    syncPromise = null;
  });

  return syncPromise;
}

export async function getPendingQueueSummary(userId?: string) {
  const items = (await getAllOutboxItems()).filter((item) => !userId || item.ownerId === userId);
  const pendingCount = items.filter((item) => item.syncStatus !== 'syncing').length;
  const failedCount = items.filter((item) => item.syncStatus === 'failed').length;
  const syncing = items.some((item) => item.syncStatus === 'syncing');

  return { pendingCount, failedCount, syncing };
}
