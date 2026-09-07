import type { UserRole } from '@/lib/types/database';

export const ALL_ROLES: UserRole[] = ['patient', 'health_worker', 'doctor', 'admin'];

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  health_worker: 'Health Worker',
  doctor: 'Doctor',
  admin: 'Administrator',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  patient: 'Access personal health records and appointments',
  health_worker: 'Manage patients, triage, and follow-ups',
  doctor: 'Conduct consultations and create referrals',
  admin: 'Full system access and facility coordination',
};

export function hasRole(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export function isAdmin(role: UserRole | null): boolean {
  return role === 'admin';
}

export function isHealthcareStaff(role: UserRole | null): boolean {
  return role === 'health_worker' || role === 'doctor' || role === 'admin';
}
