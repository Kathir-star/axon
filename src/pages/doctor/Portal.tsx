import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Search,
  User,
  Calendar,
  AlertCircle,
  FileText,
  Brain,
  History,
  QrCode
} from 'lucide-react';
import { GlassCard, Button, Input, Badge } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { MedicalRecord, Patient, Consent } from '../../types';
import { summaryAgent, riskAgent } from '../../lib/geminiClient';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

export default function DoctorPortal() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<{
    patient: Patient;
    records: MedicalRecord[];
    summary: string;
    risk: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmergencyQR, setShowEmergencyQR] = useState(false);

  const handleAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate Consent Code
      const { data: consent, error: consentError } = await supabase
        .from('consents')
        .select('*, patients(*)')
        .eq('access_code', accessCode)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();
      
      if (consentError || !consent) throw new Error("Invalid or expired access code.");

      const patient = (consent as any).patients as Patient;

      // Load Records (Bypassing RLS for demo - in prod, use a proxy/vaulted session)
      // For this implementation, we assume the code works as a temporary key
      const { data: records, error: recordsError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patient.id)
        .order('date', { ascending: false });

      if (recordsError) throw recordsError;

      // Generate Live Insights
      const summary = await summaryAgent(patient, records || []);
      const risk = await riskAgent(records || []);

      setPatientData({
        patient,
        records: records || [],
        summary,
        risk
      });

      // Log Access
      await supabase.from('audit_logs').insert([{
        patient_id: patient.id,
        action: 'DOCTOR_ACCESS_GRANTED',
        actor_email: 'attending_physician@hospital.net', // Mock email for doctor
        resource_id: consent.id
      }]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyAccess = () => {
    setShowEmergencyQR(true);
  };

  if (!patientData) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-brand-blue/10 rounded-2xl mb-6 border border-brand-blue/20">
            <ShieldCheck className="w-10 h-10 text-brand-blue" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-4">AXON Clinical View</h1>
          <p className="text-slate-400 mt-2 text-lg font-light">Enter 6-digit ephemeral vault code to decrypt clinical memory.</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleAccess} className="space-y-6">
            <Input 
              label="6-Digit Access Code" 
              placeholder="000000" 
              value={accessCode}
              onChange={e => setAccessCode(e.target.value.slice(0, 6))}
              className="text-center text-3xl font-mono tracking-widest py-6"
              maxLength={6}
              disabled={loading}
            />
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            <Button className="w-full py-4 text-lg" loading={loading}>
              Authorize Access
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <button 
              onClick={handleEmergencyAccess}
              className="text-amber-400 text-sm font-bold flex items-center gap-2 hover:text-amber-300 transition-colors"
            >
              <AlertCircle className="w-4 h-4" /> EMERGENCY OVERRIDE
            </button>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              Secure Provider Authentication Path
            </p>
          </div>
        </GlassCard>

        {/* Emergency QR Modal */}
        <AnimatePresence>
          {showEmergencyQR && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
              <GlassCard className="max-w-sm w-full text-center space-y-6">
                <h3 className="text-2xl font-bold text-amber-500">Emergency Protocol</h3>
                <p className="text-slate-400 text-sm">Scan to generate emergency read-only token for critical triage.</p>
                <div className="bg-white p-4 rounded-2xl inline-block mx-auto">
                  <QRCodeSVG value="https://axon.health/emergency/access-grant" size={200} />
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowEmergencyQR(false)}>
                  Close
                </Button>
              </GlassCard>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Doctor Patient View
  return (
    <div className="container mx-auto px-6 py-10">
      {/* Patient Bio Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-brand rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-brand-blue/20">
              {patientData.patient.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{patientData.patient.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-2">
                <span>DOB: {format(new Date(patientData.patient.dob || '1990-01-01'), 'MMM d, yyyy')}</span>
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                <span>Blood: {patientData.patient.blood_type || 'N/A'}</span>
                <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                <Badge variant="info">AXON VITALITY: {patientData.patient.health_vitality_score || '--'}/100</Badge>
              </div>
            </div>
          </div>
        <div className="flex gap-2">
          <Badge variant="success">Validated Token</Badge>
          <button 
            onClick={() => setPatientData(null)}
            className="px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-medium text-sm border border-white/5"
          >
            End Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Patient Insights & Alerts */}
        <div className="xl:col-span-1 space-y-6">
          <GlassCard className="border-brand-blue/30 bg-brand-blue/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-blue" />
              Clinical Summary
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed italic">
              "{patientData.summary}"
            </p>
          </GlassCard>

          <GlassCard className="border-red-500/20 bg-red-500/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              High Risk Indicators
            </h3>
            <div className="space-y-3">
              {patientData.risk.conditions.map((c: string, i: number) => (
                <div key={i} className="p-2 rounded-lg bg-red-500/10 border border-red-500/10 text-xs text-red-200 font-medium">
                  {c}
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Living Allergic Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {patientData.patient.allergies?.length > 0 ? (
                patientData.patient.allergies.map((a, i) => <Badge key={i} variant="error">{a}</Badge>)
              ) : (
                <span className="text-slate-500 text-xs">No known allergies logged.</span>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Longitudinal History */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              Longitudinal Clinical Record
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                placeholder="Search encounters..." 
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-hidden focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
            {patientData.records.map(record => (
              <GlassCard key={record.id} className="p-4 hover:border-white/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-lg">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">{record.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(record.date), 'MMM d, yyyy')}</span>
                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                        <span>{record.provider}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="info">{record.type}</Badge>
                </div>
                {record.data?.keyFindings && (
                  <div className="mt-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {record.data.keyFindings}
                    </p>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
