-- AXON Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Extended Patient Profile)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  clinical_id CHAR(6) UNIQUE, -- Permanent 6-digit AXON Code
  name TEXT NOT NULL,
  dob DATE,
  blood_type TEXT,
  height DECIMAL, -- in cm
  weight DECIMAL, -- in kg
  activity_level TEXT, -- sedentary, moderate, active, athletic
  allergies TEXT[] DEFAULT '{}',
  
  -- Clinical Baseline
  bp_systolic INTEGER,
  bp_diastolic INTEGER,
  heart_rate INTEGER,
  blood_sugar INTEGER,
  sleep_hours DECIMAL,
  water_intake DECIMAL,
  is_smoker BOOLEAN DEFAULT false,
  alcohol_freq TEXT,
  family_history TEXT[] DEFAULT '{}',
  
  -- AXON Context
  onboarding_complete BOOLEAN DEFAULT false,
  doctor_access_enabled BOOLEAN DEFAULT true,
  health_vitality_score INTEGER, -- 0-100
  health_score_explanation TEXT,
  improvement_areas TEXT[],
  profile_picture_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Doctor Profiles Table
CREATE TABLE IF NOT EXISTS public.doctor_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT,
  hospital_name TEXT,
  license_id TEXT,
  profile_picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Medical Records Table
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  provider TEXT,
  raw_content TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  source_path TEXT, -- Supabase Storage link
  file_url TEXT,
  summary_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Consents Table (AXON Secure Access Layer)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_email TEXT,
  access_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  ip_address TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES --
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to allow re-runs
DROP POLICY IF EXISTS "Users browse their own AXON profile" ON public.patients;
DROP POLICY IF EXISTS "Patients manage their AXON records" ON public.medical_records;
DROP POLICY IF EXISTS "Patients manage AXON access codes" ON public.consents;
DROP POLICY IF EXISTS "Patients view their neuro-audit trail" ON public.audit_logs;

-- Create Policies
CREATE POLICY "Users browse their own AXON profile" ON public.patients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Patients manage their AXON records" ON public.medical_records FOR ALL USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));
CREATE POLICY "Patients manage AXON access codes" ON public.consents FOR ALL USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));
CREATE POLICY "Patients insert their own neuro-audit trail" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));
CREATE POLICY "Patients view their neuro-audit trail" ON public.audit_logs FOR SELECT USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

-- 6. Storage Bucket for Medical Reports
-- Note: Replace '<project-id>' and execute in the SQL Editor or create via Supabase Dashboard UI
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies for medical-reports bucket (Users can only access their own files)
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-reports');
CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'medical-reports' AND auth.uid()::text = (select user_id::text from public.patients where id::text = (string_to_array(name, '/'))[1]));

-- Storage Policies for profile-pictures bucket (Users can upload their own, everyone can view public ones)
CREATE POLICY "Users can upload their own profile picture" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = SPLIT_PART(name, '/', 1));
CREATE POLICY "Users can update their own profile picture" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'profile-pictures' AND auth.uid()::text = SPLIT_PART(name, '/', 1));
CREATE POLICY "Anyone can view profile pictures" ON storage.objects FOR SELECT USING (bucket_id = 'profile-pictures');
