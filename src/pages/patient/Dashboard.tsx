import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { 
  Activity, 
  Brain, 
  History,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Lock,
  Clock,
  FileText,
  ChevronRight,
  Sparkles,
  UploadCloud,
  Settings
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { MedicalRecord } from '../../types';
import { GlassCard, Button, Badge } from '../../components/ui';
import { summaryAgent, riskAgent } from '../../lib/gemini';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, patient, refreshProfile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [riskInsight, setRiskInsight] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (patient) loadData();
  }, [patient]);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !patient) return;

    setUploading(true);
    toast.loading("Uploading & Analyzing record...", { id: 'upload' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${patient.id}_${Math.random()}.${fileExt}`;
      const filePath = `${patient.user_id}/${fileName}`;
      const mimeType = file.type || 'application/octet-stream';
      
      const { error: uploadError } = await supabase.storage
        .from('medical-reports')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('medical-reports')
        .getPublicUrl(filePath);

      // AI Ingestion Pipeline
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      
      const { extractMedicalData } = await import('../../lib/gemini');
      const structured = await extractMedicalData(base64Data, mimeType);

      const { data, error: dbError } = await supabase.from('medical_records').insert([{
        patient_id: patient.id,
        title: structured.title || file.name,
        type: structured.type || 'General',
        provider: structured.provider || 'Uploaded Report',
        date: structured.date || new Date().toISOString().split('T')[0],
        file_url: publicUrl,
        data: {},
        summary_json: {
          snippet: structured.snippet,
          keyFindings: structured.keyFindings,
          followUp: structured.followUp
        }
      }]).select().single();

      if (dbError) throw dbError;

      await supabase.from('audit_logs').insert([{
         patient_id: patient!.id,
         action_type: 'DOC_UPLOAD_AND_INGESTION',
         performed_by: user?.id,
         ip_address: '127.0.0.1',
         details: { file: file.name, document_id: data.id }
      }]);

      toast.success("Record analyzed & uploaded successfully", { id: 'upload' });
      
      const { vitalityAgent } = await import('../../lib/gemini');
      const updatedProfile = await vitalityAgent(patient);
      
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          health_vitality_score: updatedProfile.vitality_score,
          health_score_explanation: updatedProfile.explanation,
          improvement_areas: updatedProfile.improvement_areas
        })
        .eq('id', patient.id);
        
      if (!updateError) {
         await refreshProfile(); 
      }
      
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Upload failed", { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 10485760,
  });

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
    setLoading(false); // Set loading to false early so records show up

    if (data.length > 0) {
      try {
        // Run AI synthesis in background without re-blocking main loading state
        const [sum, risk] = await Promise.all([
          summaryAgent(patient, data),
          riskAgent(data)
        ]);
        setSummary(sum);
        setRiskInsight(risk);
      } catch (aiErr) {
        console.error("AI Insights failed:", aiErr);
      }
    }
  } catch (err: any) {
      console.error(err);
      toast.error("Failed to load clinical records");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="container mx-auto px-6 py-10 space-y-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-display tracking-tight text-white underline decoration-brand-blue/30 underline-offset-8">Patient Dashboard</h1>
          <p className="text-slate-400 mt-2 font-light">Overview of your medical longitudinal memory and AI-driven insights.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link to="/access">
            <Button variant="outline" className="w-full md:w-auto gap-2 h-14 border-white/10">
              <Settings className="w-4 h-4" /> Security & Access Center
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Stats Column */}
        <div className="lg:col-span-8 space-y-10">
          {/* AXON Health Vitality Score */}
          <GlassCard className="relative overflow-hidden group border-brand-cyan/20 bg-linear-to-br from-brand-cyan/10 to-transparent p-1">
            <div className="bg-slate-950/40 p-8 rounded-[inherit] relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="relative shrink-0">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={452}
                    initial={{ strokeDashoffset: 452 }}
                    animate={{ strokeDashoffset: 452 - (452 * (patient?.health_vitality_score || 0)) / 100 }}
                    transition={{ duration: 2, ease: "circOut" }}
                    className="text-brand-cyan shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold font-mono text-white">{patient?.health_vitality_score || '--'}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">AXON Index</span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h2 className="text-2xl font-bold tracking-tight">Intelligence Vitality Score</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {patient?.health_score_explanation || "Your baseline vitality score derived from clinical vitals, lifestyle markers, and neurological clinical history."}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                  {patient?.improvement_areas?.map((area, i) => (
                    <Badge key={i} variant="info" className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20">
                      {area}
                    </Badge>
                  ))}
                  {!patient?.improvement_areas?.length && (
                    <Badge variant="outline" className="opacity-50">Waiting for baseline sync...</Badge>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* AI Intelligence Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="border-brand-blue/20 bg-brand-blue/5 p-6 hover:bg-brand-blue/10 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-brand-blue" />
                  <h3 className="font-bold tracking-tight">Health Summary</h3>
                </div>
                {loading && (
                   <motion.img 
                    src="https://i.ibb.co/Cpsv0qY7/73024ef0-7fe4-4884-96b1-58af0a49ff7c.png" 
                    alt="AXON Logo" 
                    className="h-4 opacity-40"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {!loading && <Sparkles className="w-4 h-4 text-brand-blue animate-pulse" />}
              </div>
              {loading ? <SkeletonLines /> : (
                <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-brand-blue/30 pl-4">
                  "{summary || 'Neural clinical history awaiting ingestion and synthesis.'}"
                </p>
              )}
            </GlassCard>

            <GlassCard className={clsx("p-6 transition-all", riskInsight?.risk_level === 'high' ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5')}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className={riskInsight?.risk_level === 'high' ? 'text-red-400' : 'text-emerald-400'} />
                  <h3 className="font-bold tracking-tight">Health Trajectory</h3>
                </div>
                {riskInsight && <Badge variant={riskInsight.risk_level === 'high' ? 'error' : 'success'} className="uppercase font-mono">{riskInsight.risk_level}</Badge>}
              </div>
              {loading ? <SkeletonLines /> : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {riskInsight?.reasoning || 'Insufficient data vectors to project chronic health trajectory.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {riskInsight?.conditions?.map((c: any, i: any) => (
                      <span key={i} className="text-[10px] font-bold px-3 py-1 bg-white/5 rounded-full border border-white/10 text-slate-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Uploaded Reports List / Timeline */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-slate-500" />
                Reports & Timeline
              </h3>
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <Button size="sm" variant="outline" className="gap-2 border-brand-blue/30 text-brand-blue hover:bg-brand-blue/10">
                   <UploadCloud className="w-4 h-4" /> Upload Record
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {records.map(record => (
                <RecordCardLite key={record.id} record={record} />
              ))}
              {records.length === 0 && !loading && (
                <div {...getRootProps()} className="p-12 text-center rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <input {...getInputProps()} />
                  <UploadCloud className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm">Clinical history is currently empty.</p>
                  <p className="text-slate-600 text-xs mt-2">Drag and drop or click to upload</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="lg:col-span-4 space-y-8">
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-cyan" />
                <h3 className="font-bold tracking-tight">Baseline Discovery</h3>
              </div>
              <Link to="/onboarding" className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest">Edit</Link>
            </div>
            <div className="space-y-6">
               <MetaGroup label="Core Indicators" items={[
                { label: 'Blood Pressure', value: patient?.bp_systolic ? `${patient.bp_systolic}/${patient.bp_diastolic} mmHg` : 'Not Set' },
                { label: 'Resting Heart Rate', value: patient?.heart_rate ? `${patient.heart_rate} BPM` : 'Not Set' },
                { label: 'Blood Sugar', value: patient?.blood_sugar ? `${patient.blood_sugar} mg/dL` : 'Not Set' }
              ]} />
              <div className="h-px bg-white/5" />
              <MetaGroup label="Neural Metrics" items={[
                { label: 'Average Sleep', value: `${patient?.sleep_hours || 0} Hrs/Day` },
                { label: 'Daily Hydration', value: `${patient?.water_intake || 0} L/Day` }
              ]} />
            </div>
          </GlassCard>
        </div>
      </div>
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
          <span>{format(new Date(record.date), 'MMM d, yyyy')}</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span>{record.provider}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
       {record.file_url && (
         <a href={record.file_url} target="_blank" rel="noreferrer" className="text-[10px] uppercase font-bold text-brand-blue tracking-widest hover:underline">
           View PDF
         </a>
       )}
      <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </div>
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
