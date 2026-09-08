import { supabaseClient } from '@/lib/supabase/client';
import {
  deleteRecord,
  getAllOutboxItems,
  saveOutboxItem,
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

export type PatientAppointmentOutboxPayload =
  | PendingPatientTriage
  | PendingPatientAppointment;

const APPOINTMENT_RESOURCES = new Set(['triage_assessments', 'appointments']);

let syncPromise: Promise<number> | null = null;

function isPendingItemForUser(item: OutboxItem, userId: string) {
  if (!APPOINTMENT_RESOURCES.has(item.resource) || item.operationType !== 'insert') {
    return false;
  }

  return item.ownerId === userId;
}

async function rowExists(resource: 'triage_assessments' | 'appointments', id: string) {
  const result = resource === 'triage_assessments'
    ? await supabaseClient.from('triage_assessments').select('id').eq('id', id).maybeSingle()
    : await supabaseClient.from('appointments').select('id').eq('id', id).maybeSingle();

  return !result.error && Boolean(result.data);
}

async function sendItem(item: OutboxItem) {
  const payload = item.payload as PatientAppointmentOutboxPayload;

  if (item.resource === 'triage_assessments') {
    const { error } = await supabaseClient
      .from('triage_assessments')
      .insert(payload as never);
    if (error && !(await rowExists('triage_assessments', item.localOperationId))) {
      throw error;
    }
    return;
  }

  const { error } = await supabaseClient
    .from('appointments')
    .insert(payload as never);
  if (error && !(await rowExists('appointments', item.localOperationId))) {
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
      break;
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
