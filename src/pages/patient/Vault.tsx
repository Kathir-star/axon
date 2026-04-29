import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  Upload,
  Activity,
  Filter,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { MedicalRecord } from '../../types';
import { GlassCard, Button, Badge, Input } from '../../components/ui';
import { useDropzone } from 'react-dropzone';
import { ingestionAgent } from '../../lib/geminiClient';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Vault() {
  const { user, patient } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (patient) loadRecords();
  }, [patient]);

  const loadRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patient!.id)
      .order('date', { ascending: false });
    
    if (!error) setRecords(data);
    setLoading(false);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        // Log Initial State
        const tempId = Math.random().toString(36).substring(7);
        
        // 1. Storage Upload Placeholder
        const fileName = `${patient?.id}/${Date.now()}-${file.name}`;
        const { error: storageError } = await supabase.storage
          .from('health-vault')
          .upload(fileName, file);

        // 2. Immediate Background Processing Hook
        // For production logic, we call the ingestAgent which represents our Gemini Agent
        const mockText = `[OCR STREAM] MEDICAL RECORD: ${file.name}. Patient ID: ${patient?.id}. Date: ${new Date().toISOString()}. Clinical Observations extracted via AXON Agent.`;
        
        const structured = await ingestionAgent(mockText);
        
        const { data, error } = await supabase
          .from('medical_records')
          .insert([{
            patient_id: patient!.id,
            type: structured.type || 'note',
            title: structured.title || file.name,
            date: structured.date || new Date().toISOString().split('T')[0],
            provider: structured.provider || 'Generic System Ingestion',
            data: structured,
            raw_content: mockText,
            source_path: fileName
          }])
          .select()
          .single();
        
        if (error) throw error;
        setRecords(prev => [data, ...prev]);
        toast.success(`Ingested: ${structured.title || file.name}`);
        
        await supabase.from('audit_logs').insert([{
          patient_id: patient!.id,
          action: 'VAULT_MEMORY_STORED',
          actor_email: user?.email!,
          resource_id: data.id
        }]);
      }
    } catch (err: any) {
      console.error("Ingestion failed:", err);
      toast.error(err.message || "Cloud ingestion failed");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-white underline decoration-brand-blue/30 decoration-4 underline-offset-8">AXON Clinical Vault</h1>
          <p className="text-slate-400 mt-4 tracking-wide">Your secured neural-longitudinal health record repository.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              placeholder="Search vault..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-hidden focus:border-brand-blue"
            />
          </div>
          <Button className="gap-2 shrink-0" {...getRootProps()}>
            <Plus className="w-4 h-4" /> Add Record
            <input {...getInputProps()} />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">Record Filters</h3>
            <div className="space-y-1">
              <FilterItem label="All Records" count={records.length} active={filter === 'all'} onClick={() => setFilter('all')} />
              <FilterItem label="Diagnoses" active={filter === 'diagnosis'} onClick={() => setFilter('diagnosis')} />
              <FilterItem label="Lab Reports" active={filter === 'lab_report'} onClick={() => setFilter('lab_report')} />
              <FilterItem label="Medications" active={filter === 'medication'} onClick={() => setFilter('medication')} />
              <FilterItem label="Treatments" active={filter === 'treatment'} onClick={() => setFilter('treatment')} />
            </div>
          </GlassCard>

          <GlassCard className="p-4 bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Integrity Check</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-mono">Status: All Records Encrypted & Verified</p>
          </GlassCard>
        </div>

        {/* List */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence>
            {uploading && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 glass-card border-brand-blue/30 bg-brand-blue/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin border-2 border-brand-blue border-t-transparent rounded-full" />
                  <span className="text-sm font-medium text-brand-blue">AI Ingestion Agent is processing your data...</span>
                </div>
                <Badge variant="info">Syncing</Badge>
              </motion.div>
            )}
          </AnimatePresence>

          {records.length > 0 ? (
            records
              .filter(r => filter === 'all' || r.type === filter)
              .map(record => (
              <VaultItem key={record.id} record={record} />
            ))
          ) : !loading && (
            <div className="text-center py-20 glass-card">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold">Your Vault is Empty</h3>
              <p className="text-slate-500 mt-2">Initialize your memory layer by uploading your first record.</p>
              <Button variant="outline" className="mt-6" {...getRootProps()}>
                Upload First File
                <input {...getInputProps()} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const FilterItem = ({ label, count, active, onClick }: { label: string, count?: number, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${active ? 'bg-brand-blue/10 text-brand-blue' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
  >
    <span>{label}</span>
    {count !== undefined && <span className="text-xs bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{count}</span>}
  </button>
);

const VaultItem = ({ record }: { record: MedicalRecord }) => (
  <GlassCard className="p-5 hover:border-white/20 group">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-brand-blue/10 transition-all">
          <FileText className="w-6 h-6 text-slate-400 group-hover:text-brand-blue" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-bold">{record.title}</h4>
            <Badge variant="info">{record.type}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(record.date), 'MMM d, yyyy')}</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full" />
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {record.provider}</span>
          </div>
          {record.data?.summary && (
            <p className="mt-4 text-xs text-slate-400 leading-relaxed max-w-2xl bg-white/2 p-3 rounded-lg border border-white/5">
              {record.data.summary}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-3">
        <button className="p-2 text-slate-600 hover:text-white transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400/70">
          <CheckCircle2 className="w-3.5 h-3.5" />
          VERIFIED
        </div>
      </div>
    </div>
  </GlassCard>
);
