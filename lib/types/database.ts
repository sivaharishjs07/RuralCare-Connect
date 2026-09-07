export type UserRole = 'patient' | 'health_worker' | 'doctor' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  language: string | null;
  created_at: string;
};

export type Facility = {
  id: string;
  name: string;
  type: 'clinic' | 'hospital' | 'health_center' | 'dispensary' | null;
  district: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type Patient = {
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

export type HealthRecord = {
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
  created_at: string;
  updated_at: string;
};

export type TriageAssessment = {
  id: string;
  patient_id: string;
  symptoms: unknown;
  risk_level: 'low' | 'medium' | 'high' | 'emergency';
  risk_score: number | null;
  recommendation: string | null;
  created_by: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  facility_id: string | null;
  appointment_date: string;
  status:
    | 'scheduled'
    | 'checked_in'
    | 'in_consultation'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | null;
  queue_number: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Referral = {
  id: string;
  patient_id: string;
  source_facility_id: string | null;
  destination_facility_id: string | null;
  referred_by: string | null;
  reason: string;
  priority: 'routine' | 'urgent' | 'emergency' | null;
  status:
    | 'created'
    | 'patient_notified'
    | 'in_progress'
    | 'arrived'
    | 'completed'
    | 'missed'
    | 'cancelled'
    | null;
  referral_date: string;
  expected_visit_date: string | null;
  completed_at: string | null;
  created_at: string;
};

export type ReferralEvent = {
  id: string;
  referral_id: string;
  event_type:
    | 'created'
    | 'notified'
    | 'in_progress'
    | 'arrived'
    | 'completed'
    | 'cancelled'
    | null;
  description: string | null;
  recorded_by: string | null;
  created_at: string;
};

export type FollowUp = {
  id: string;
  patient_id: string;
  health_worker_id: string | null;
  referral_id: string | null;
  follow_up_date: string;
  status:
    | 'scheduled'
    | 'completed'
    | 'missed'
    | 'cancelled'
    | null;
  priority: string | null;
  notes: string | null;
  created_at: string;
};

export type Medicine = {
  id: string;
  name: string;
  category: string | null;
  manufacturer: string | null;
  created_at: string;
};

export type FacilityMedicineInventory = {
  id: string;
  facility_id: string;
  medicine_id: string;
  available_quantity: number;
  minimum_stock: number | null;
  last_updated: string;
};

export type Notification = {
  id: string;
  user_id: string | null;
  patient_id: string | null;
  type:
    | 'referral'
    | 'appointment'
    | 'follow_up'
    | 'triage'
    | 'inventory'
    | 'system'
    | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };

      facilities: {
        Row: Facility;
        Insert: Partial<Facility>;
        Update: Partial<Facility>;
        Relationships: [];
      };

      patients: {
        Row: Patient;
        Insert: Partial<Patient>;
        Update: Partial<Patient>;
        Relationships: [];
      };

      health_records: {
        Row: HealthRecord;
        Insert: Partial<HealthRecord>;
        Update: Partial<HealthRecord>;
        Relationships: [];
      };

      triage_assessments: {
        Row: TriageAssessment;
        Insert: Partial<TriageAssessment>;
        Update: Partial<TriageAssessment>;
        Relationships: [];
      };

      appointments: {
        Row: Appointment;
        Insert: Partial<Appointment>;
        Update: Partial<Appointment>;
        Relationships: [];
      };

      referrals: {
        Row: Referral;
        Insert: Partial<Referral>;
        Update: Partial<Referral>;
        Relationships: [];
      };

      referral_events: {
        Row: ReferralEvent;
        Insert: Partial<ReferralEvent>;
        Update: Partial<ReferralEvent>;
        Relationships: [];
      };

      follow_ups: {
        Row: FollowUp;
        Insert: Partial<FollowUp>;
        Update: Partial<FollowUp>;
        Relationships: [];
      };

      medicines: {
        Row: Medicine;
        Insert: Partial<Medicine>;
        Update: Partial<Medicine>;
        Relationships: [];
      };

      facility_medicine_inventory: {
        Row: FacilityMedicineInventory;
        Insert: Partial<FacilityMedicineInventory>;
        Update: Partial<FacilityMedicineInventory>;
        Relationships: [];
      };

      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};