/**
 * AXON Global Types
 */

export interface Patient {
  id: string;
  user_id: string;
  clinical_id?: string;
  name: string;
  dob: string;
  blood_type?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  allergies: string[];
  
  // Clinical Baseline
  bp_systolic?: number;
  bp_diastolic?: number;
  heart_rate?: number;
  blood_sugar?: number;
  sleep_hours?: number;
  water_intake?: number;
  is_smoker?: boolean;
  alcohol_freq?: string;
  family_history?: string[];
  
  // AXON Context
  onboarding_complete: boolean;
  doctor_access_enabled: boolean;
  health_vitality_score?: number;
  health_score_explanation?: string;
  improvement_areas?: string[];
  profile_picture_url?: string;
  
  created_at: string;
}

export type RecordType = 'Diagnosis' | 'Medication' | 'Lab Report' | 'Treatment' | 'General' | 'diagnosis' | 'medication';

export interface MedicalRecord {
  id: string;
  patient_id: string;
  type: RecordType;
  title: string;
  date: string;
  provider?: string;
  raw_content?: string;
  data: any;
  file_url?: string;
  summary_json?: {
    snippet?: string;
    keyFindings?: string[];
    followUp?: string[];
  };
  created_at: string;
}

export interface Consent {
  id: string;
  patient_id: string;
  doctor_email?: string;
  access_code: string;
  expires_at: string;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
}

export interface AuditLog {
  id: string;
  patient_id: string;
  action_type: string;
  performed_by?: string;
  ip_address?: string;
  details?: any;
  timestamp: string;
}

export interface AIInsight {
  type: 'risk' | 'pattern' | 'summary' | 'medication';
  title: string;
  content: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}
