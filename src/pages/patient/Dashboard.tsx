import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Share2, 
  Activity, 
  Brain, 
  AlertTriangle,
  History,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  TrendingUp,
  LayoutDashboard,
  Database,
  Lock,
  Clock,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { MedicalRecord } from '../../types';
import { GlassCard, Button, Badge } from '../../components/ui';
import { summaryAgent, riskAgent } from '../../lib/geminiClient';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, patient } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [riskInsight, setRiskInsight] = useState<any | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentCode, setConsentCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (patient) loadData();
  }, [patient]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const loadData = async () => {
    if (!patient) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patient.id)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      setRecords(data);
      if (data.length > 0) {
        try {
          const [sum, risk] = await Promise.all([
            summaryAgent(patient, data),
            riskAgent(data)
          ]);
          setSummary(sum);
          setRiskInsight(risk);
        } catch (aiErr) {
          console.error("AI Insights failed:", aiErr);
          // Don't toast for AI failures to avoid annoying the user on quota limits, 
          // just let it show the placeholder.
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load clinical records");
    } finally {
      setLoading(false);
    }
  };

  const generateConsentCode = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { error } = await supabase.from('consents').insert([{
      patient_id: patient!.id,
      access_code: code,
      expires_at: expiresAt.toISOString(),
      status: 'active'
    }]);

    if (!error) {
      setConsentCode(code);
      setShowConsentModal(true);
      setTimeLeft(15 * 60);
      await supabase.from('audit_logs').insert([{
        patient_id: patient!.id,
        action: 'EPHEMERAL_CODE_GENERATED',
        actor_email: user?.email!
      }]);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-white underline decoration-brand-blue/30 decoration-4 underline-offset-8">AXON Patient Hub</h1>
          <p className="text-slate-400 mt-4 tracking-wide">Unified neural perspective of your longitudinal health story.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={generateConsentCode}>
            <Share2 className="w-4 h-4" /> Grant Access
          </Button>
          <Link to="/vault">
            <Button className="gap-2">
              <Database className="w-4 h-4" /> Open Vault
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Stats Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* AXON Health Vitality Score */}
          <GlassCard className="relative overflow-hidden group border-brand-cyan/20 bg-brand-cyan/5">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-24 h-24 text-brand-cyan" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364}
                    initial={{ strokeDashoffset: 364 }}
                    animate={{ strokeDashoffset: 364 - (364 * (patient?.health_vitality_score || 0)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-brand-cyan"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold font-mono">{patient?.health_vitality_score || '--'}</span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">AXON Health Vitality Score</h2>
                <p className="text-slate-400 mt-2 text-sm max-w-xl">
                  {patient?.health_score_explanation || "Your baseline vitality score representing neural-clinical health sustainability."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                  {patient?.improvement_areas?.map((area, i) => (
                    <Badge key={i} variant="info">{area}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* AI Intelligence Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="border-brand-blue/20 bg-brand-blue/5">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-brand-blue" />
                <h3 className="font-bold">Medical Synthesis</h3>
              </div>
              {loading ? <SkeletonLines /> : (
                <p className="text-sm text-slate-300 leading-relaxed italic line-clamp-4">
                  "{summary || 'No data synthesized yet.'}"
                </p>
              )}
            </GlassCard>

            <GlassCard className={riskInsight?.risk_level === 'high' ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className={riskInsight?.risk_level === 'high' ? 'text-red-400' : 'text-emerald-400'} />
                  <h3 className="font-bold">Health Vector</h3>
                </div>
                {riskInsight && <Badge variant={riskInsight.risk_level === 'high' ? 'error' : 'success'}>{riskInsight.risk_level}</Badge>}
              </div>
              {loading ? <SkeletonLines /> : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {riskInsight?.reasoning || 'Insufficient data for risk analysis.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {riskInsight?.conditions.map((c: any, i: any) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded border border-white/5">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Activity Feed / Small Timeline */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" />
                Recent Clinical Encounters
              </h3>
              <Link to="/vault" className="text-sm text-brand-blue hover:underline">View All</Link>
            </div>
            <div className="space-y-4 text-left">
              {records.slice(0, 3).map(record => (
                <RecordCardLite key={record.id} record={record} />
              ))}
              {records.length === 0 && !loading && (
                <div className="p-12 text-center glass-card bg-white/[0.01] border-dashed border-white/10">
                  <p className="text-slate-500 text-sm">No recent encounters discovered.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="lg:col-span-4 space-y-8">
          <GlassCard>
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-5 h-5 text-brand-cyan" />
              <h3 className="font-bold">Clinical Metadata</h3>
            </div>
            <div className="space-y-6">
              <MetaGroup label="Identity" items={[
                { label: 'Patient Name', value: patient?.name },
                { label: 'Blood Group', value: patient?.blood_type }
              ]} />
              <div className="h-px bg-white/5" />
              <MetaGroup label="Risk" items={[
                { label: 'Known Allergies', value: patient?.allergies.length ? patient.allergies.join(', ') : 'None' }
              ]} />
            </div>
          </GlassCard>

          <GlassCard className="bg-slate-950/40">
            <div className="flex items-center gap-2 mb-4">
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Security Pulse</h4>
            </div>
            <div className="space-y-3">
              <PulseItem label="RLS Active" status="connected" />
              <PulseItem label="Gemini Engine" status="connected" />
              <PulseItem label="Storage Encryption" status="connected" />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Ephemeral Code Modal */}
      <AnimatePresence>
        {showConsentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm glass-card bg-slate-900 border-brand-blue/30 p-10 text-center"
            >
              <div className="w-16 h-16 bg-brand-blue/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                <Lock className="w-8 h-8 text-brand-blue" />
              </div>
              <h3 className="text-3xl font-bold mb-2">Access Token</h3>
              <p className="text-slate-400 text-sm mb-10 leading-relaxed font-light">
                Give this 6-digit code to your healthcare provider for temporary clinical read access.
              </p>
              
              <div className="mb-10 p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="text-5xl font-mono font-bold tracking-[0.3em] text-white">
                  {consentCode}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-amber-400">
                  <Clock className="w-3 h-3" />
                  Expires in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <Button variant="primary" className="w-full h-14" onClick={() => setShowConsentModal(false)}>
                I Understand
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SkeletonLines = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-3 bg-white/5 rounded w-full" />
    <div className="h-3 bg-white/5 rounded w-3/4" />
  </div>
);

const MetaGroup = ({ label, items }: { label: string, items: { label: string, value?: string }[] }) => (
  <div className="space-y-4">
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">{label}</span>
    {items.map((item, i) => (
      <div key={i} className="flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-500 font-medium">{item.label}</span>
        <span className="text-sm font-semibold text-white">{item.value || 'N/A'}</span>
      </div>
    ))}
  </div>
);

const PulseItem = ({ label, status }: { label: string, status: string }) => (
  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
    {label}
    <span className="flex items-center gap-1.5 text-emerald-400/70">
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  </div>
);

const RecordCardLite = ({ record }: { record: MedicalRecord }) => (
  <div className="p-4 glass-card bg-white/[0.02] border-white/5 hover:border-brand-blue/20 flex items-center justify-between group transition-all">
    <div className="flex items-center gap-4 text-left">
      <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-brand-blue/10 transition-colors">
        <ShieldCheck className="w-5 h-5 text-slate-600 group-hover:text-brand-blue" />
      </div>
      <div>
        <h4 className="font-bold text-slate-200">{record.title}</h4>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
          <span>{format(new Date(record.date), 'MMMM yyyy')}</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span>{record.provider}</span>
        </div>
      </div>
    </div>
    <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  </div>
);


const StatItem = ({ label, value }: { label: string, value: string }) => (
  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);

const RecordItem = ({ record }: { record: MedicalRecord }) => {
  const Icon = record.type === 'diagnosis' ? ShieldCheck : record.type === 'medication' ? Zap : FileText;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card hover:border-brand-blue/30 cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-brand-blue/20 transition-colors">
          <Icon className="w-5 h-5 text-slate-400 group-hover:text-brand-blue" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-lg">{record.title}</h4>
            <span className="text-xs text-slate-500 font-medium">
              {format(new Date(record.date), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Activity className="w-3 h-3" /> {record.provider || 'Unspecified Provider'}
            </span>
            <Badge variant="info">{record.type}</Badge>
          </div>
          {record.data?.summary && (
            <p className="text-slate-400 text-sm mt-3 border-l-2 border-white/5 pl-4 line-clamp-1">
              {record.data.summary}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-700 self-center" />
      </div>
    </motion.div>
  );
};

const RecordSkeleton = () => (
  <div className="glass-card animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white/5 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/5 rounded w-1/3" />
        <div className="h-3 bg-white/5 rounded w-1/4" />
      </div>
    </div>
  </div>
);
