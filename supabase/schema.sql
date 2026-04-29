-- AXON Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Extended Patient Profile)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  dob DATE,
  blood_type TEXT,
  height DECIMAL, -- in cm
  weight DECIMAL, -- in kg
  activity_level TEXT, -- sedentary, moderate, active, athletic
  allergies TEXT[] DEFAULT '{}',
  health_vitality_score INTEGER, -- 0-100
  health_score_explanation TEXT,
  improvement_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Medical Records Table
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('diagnosis', 'medication', 'lab_report', 'treatment', 'note')),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  provider TEXT,
  raw_content TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  source_path TEXT, -- Supabase Storage link
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
  action TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  resource_id UUID,
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
CREATE POLICY "Patients view their neuro-audit trail" ON public.audit_logs FOR ALL USING (patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));
