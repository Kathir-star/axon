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
import { synthesizeLongitudinalHistory, riskAgent } from '../../lib/gemini';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function DoctorPortal() {
  const { user, isDoctor, loading: authLoading } = useAuth();
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
  const [historySearch, setHistorySearch] = useState('');

  if (authLoading) return null;
  if (!user || !isDoctor) {
    return <Navigate to="/login?role=doctor" replace />;
  }

  const handleAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const code = accessCode.trim().toUpperCase();

    try {
      // Logic 1: Permanent Clinical ID Retrieval
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('clinical_id', code)
        .eq('doctor_access_enabled', true)
        .maybeSingle();
      
      if (patient) {
        await loadPatientInsights(patient as Patient);
        return;
      }

      // Logic 2: Ephemeral Vault Code Fallback
      const { data: consent, error: consentError } = await supabase
        .from('consents')
        .select('*, patients(*)')
        .eq('access_code', code)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (consent) {
        const consentedPatient = (consent as any).patients as Patient;
        await loadPatientInsights(consentedPatient);
        return;
      }

      throw new Error("Access Denied. Ensure the Doctor's Key is correct and access is enabled by the patient.");

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientInsights = async (patient: Patient) => {
    // Load Records
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patient.id)
      .order('date', { ascending: false });

    if (recordsError) throw recordsError;

    // Generate Live Insights using Gemini 1.5 Pro
    const summary = await synthesizeLongitudinalHistory(records || []);
    const risk = await riskAgent(records || []);

    setPatientData({
      patient,
      records: records || [],
      summary: summary.clinicalSummary,
      risk
    });

    // Log Access
    await supabase.from('audit_logs').insert([{
      patient_id: patient.id,
      action: 'DOCTOR_ACCESS_GRANTED',
      actor_email: 'clinical_provider@axon.network', 
    }]);
  };

  const handleEmergencyAccess = () => {
    setShowEmergencyQR(true);
  };

  if (!patientData) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center -mt-16 px-6">
        <div className="text-center mb-16 max-w-2xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-5 bg-brand-blue/10 rounded-3xl mb-8 border border-brand-blue/20"
          >
            <ShieldCheck className="w-12 h-12 text-brand-blue" />
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 font-display">Provider Access</h1>
          <p className="text-slate-400 text-xl font-light leading-relaxed">
            Enter the 6-digit Doctor's Key or ephemeral vault code to decrypt clinical memory.
          </p>
        </div>

        <GlassCard className="p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5">
          <form onSubmit={handleAccess} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Clinical ID / Doctor's Key</label>
              <Input 
                placeholder="000000" 
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.slice(0, 6))}
                className="text-center text-5xl font-mono tracking-[0.3em] py-8 border-white/10 bg-white/[0.02]"
                maxLength={6}
                disabled={loading}
              />
            </div>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}
            <Button className="w-full py-5 text-xl font-bold tracking-tight shadow-lg shadow-brand-blue/20" loading={loading}>
              Decrypt Patient Records
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
            <button 
              onClick={handleEmergencyAccess}
              className="text-amber-500 text-sm font-bold flex items-center gap-2 hover:text-amber-300 transition-colors uppercase tracking-widest"
            >
              <AlertCircle className="w-4 h-4" /> Emergency Override Protocol
            </button>
            <div className="flex items-center gap-2 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
              <Key className="w-3 h-3 text-brand-blue" />
              Secure 256-Bit Neural Encryption
            </div>
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 p-8 glass-card border-brand-blue/20 bg-brand-blue/5">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-blue to-brand-purple rounded-3xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-brand-blue/20 text-white">
              {patientData.patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold text-white tracking-tight">{patientData.patient.name}</h2>
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Authenticated Access</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mt-3">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> DOB: {format(new Date(patientData.patient.dob || '1990-01-01'), 'MMM d, yyyy')}</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" /> Blood: {patientData.patient.blood_type || 'N/A'}</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="text-brand-cyan font-mono font-bold tracking-widest uppercase text-xs">Vitality Index: {patientData.patient.health_vitality_score || '--'}/100</span>
              </div>
            </div>
          </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setPatientData(null)}
            className="px-6 py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-white/5"
          >
            End Clinical Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Patient Insights & Alerts */}
        <div className="xl:col-span-1 space-y-6">
          <GlassCard className="border-brand-blue/30 bg-brand-blue/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-blue" />
              Intelligence Brief
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-brand-blue/30 pl-4">
              "{patientData.summary}"
            </p>
          </GlassCard>

          <GlassCard className="border-red-500/20 bg-red-500/5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Risk Markers
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
              Health History
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                placeholder="Search history..." 
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-hidden focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
            {patientData.records
              .filter(r => 
                r.title.toLowerCase().includes(historySearch.toLowerCase()) || 
                r.provider.toLowerCase().includes(historySearch.toLowerCase())
              )
              .map(record => (
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
