import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Appointment, Database, Facility, Patient, Profile } from '@/lib/types/database';

export type IvrErrorCode = 'invalid_request' | 'unauthorized' | 'not_found' | 'unavailable' | 'conflict';

export class IvrServiceError extends Error {
  constructor(public readonly code: IvrErrorCode, message: string, public readonly status = 400) {
    super(message);
    this.name = 'IvrServiceError';
  }
}

function getIvrClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new IvrServiceError('unavailable', 'IVR database integration is not configured.', 503);
  return createClient<Database>(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function assertIvrSecret(request: Request) {
  const expected = process.env.IVR_SHARED_SECRET;
  const supplied = request.headers.get('x-ivr-secret');
  if (!expected || !supplied || supplied !== expected) throw new IvrServiceError('unauthorized', 'Invalid IVR credentials.', 401);
}

export function normalisePhone(value: unknown) {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/[^0-9+]/g, '');
  return digits.length >= 7 && digits.length <= 16 ? digits : null;
}

export function parseDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{8}$/.test(value)) return null;
  const day = Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const year = Number(value.slice(4));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

export async function findPatientByPhone(phone: string): Promise<Patient> {
  const client = getIvrClient();
  const { data, error } = await client.from('patients').select('*').eq('phone', phone).maybeSingle();
  if (error) throw new IvrServiceError('unavailable', 'Patient lookup is unavailable.', 503);
  if (!data) throw new IvrServiceError('not_found', 'Patient was not found.', 404);
  return data as Patient;
}

export async function listBookingOptions() {
  const client = getIvrClient();
  const [facilities, doctors] = await Promise.all([
    client.from('facilities').select('id, name').order('name', { ascending: true }),
    client.from('profiles').select('id, full_name').eq('role', 'doctor').order('full_name', { ascending: true }),
  ]);
  if (facilities.error || doctors.error) throw new IvrServiceError('unavailable', 'Booking options are unavailable.', 503);
  return { facilities: (facilities.data ?? []) as Pick<Facility, 'id' | 'name'>[], doctors: (doctors.data ?? []) as Pick<Profile, 'id' | 'full_name'>[] };
}

export async function createAppointment(input: { patientId: string; appointmentDate: string; facilityId?: string | null; doctorId?: string | null }) {
  const client = getIvrClient();
  const { data: existing } = await client.from('appointments').select('id').eq('patient_id', input.patientId).eq('appointment_date', input.appointmentDate).in('status', ['scheduled', 'checked_in', 'in_consultation']).maybeSingle();
  if (existing) throw new IvrServiceError('conflict', 'An appointment already exists at that time.', 409);
  const { data, error } = await client.from('appointments').insert({ patient_id: input.patientId, appointment_date: input.appointmentDate, facility_id: input.facilityId ?? null, doctor_id: input.doctorId ?? null, status: 'scheduled', queue_number: null, notes: 'Booked through IVR.' }).select('*').single();
  if (error || !data) throw new IvrServiceError('unavailable', 'Appointment could not be created.', 503);
  return data as Appointment;
}

export async function getPatientAppointments(patientId: string) {
  const client = getIvrClient();
  const { data, error } = await client.from('appointments').select('*').eq('patient_id', patientId).order('appointment_date', { ascending: true }).limit(5);
  if (error) throw new IvrServiceError('unavailable', 'Appointment status is unavailable.', 503);
  return (data ?? []) as Appointment[];
}

export async function getAppointmentContext(appointments: Appointment[]) {
  const client = getIvrClient();
  const facilityIds = Array.from(new Set(appointments.map((item) => item.facility_id).filter((id): id is string => Boolean(id))));
  const doctorIds = Array.from(new Set(appointments.map((item) => item.doctor_id).filter((id): id is string => Boolean(id))));
  const [facilities, doctors] = await Promise.all([
    facilityIds.length ? client.from('facilities').select('id, name').in('id', facilityIds) : Promise.resolve({ data: [], error: null }),
    doctorIds.length ? client.from('profiles').select('id, full_name').in('id', doctorIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (facilities.error || doctors.error) throw new IvrServiceError('unavailable', 'Appointment details are unavailable.', 503);
  return {
    facilities: new Map((facilities.data ?? []).map((item) => [item.id, item.name])),
    doctors: new Map((doctors.data ?? []).map((item) => [item.id, item.full_name])),
  };
}
