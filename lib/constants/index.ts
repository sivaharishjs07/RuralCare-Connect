// Application-wide constants for RuralCare Connect

export const APP_NAME = 'RuralCare Connect';

export const REFERRAL_STATUSES = [
  'pending',
  'in_progress',
  'arrived',
  'completed',
  'cancelled',
] as const;

export const TRIAGE_SEVERITIES = [
  'critical',
  'urgent',
  'standard',
  'low',
] as const;

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'checked_in',
  'in_consultation',
  'completed',
  'cancelled',
  'no_show',
] as const;

export const FOLLOW_UP_STATUSES = [
  'scheduled',
  'completed',
  'missed',
  'cancelled',
] as const;

export const FACILITY_TYPES = [
  'clinic',
  'hospital',
  'health_center',
  'dispensary',
] as const;

export const USER_ROLES = [
  'admin',
  'healthcare_worker',
  'facility_coordinator',
] as const;

export const CARE_JOURNEY_STEPS = [
  'Registration',
  'Triage',
  'Consultation',
  'Referral Created',
  'Patient Notified',
  'In Progress',
  'Arrived at Destination',
  'Care Completed',
  'Follow-up Scheduled',
  'Follow-up Completed',
] as const;
