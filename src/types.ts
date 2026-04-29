/**
 * AXON Global Types
 */

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  dob: string;
  blood_type?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  allergies: string[];
  health_vitality_score?: number;
  health_score_explanation?: string;
  improvement_areas?: string[];
  created_at: string;
}

export type RecordType = 'diagnosis' | 'medication' | 'lab_report' | 'treatment' | 'note';

export interface MedicalRecord {
  id: string;
  patient_id: string;
  type: RecordType;
  title: string;
  date: string;
  provider?: string;
  raw_content?: string;
  data: any;
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
  action: string;
  actor_email: string;
  resource_id?: string;
  timestamp: string;
}

export interface AIInsight {
  type: 'risk' | 'pattern' | 'summary' | 'medication';
  title: string;
  content: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}
