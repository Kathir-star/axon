import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Loader2, AlertTriangle, Pill, ActivitySquare, CheckCircle2 } from "lucide-react";
import { synthesizeLongitudinalHistory } from "../../lib/gemini";

export default function DoctorPatientView() {
  const { code } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [synthesis, setSynthesis] = useState<any>(null);
  const [rawRecordsCount, setRawRecordsCount] = useState(0);

  useEffect(() => {
    const fetchPatientData = async () => {
      // In production:
      // 1. Verify access code against the database.
      // 2. If valid, fetch medical_records for the associated patient.
      
      // Placeholder for record fetching
      const activeRecords: any[] = []; 
      
      if (activeRecords.length === 0) {
         setError("No medical records found or invalid access code.");
         setLoading(false);
         return;
      }

      setRawRecordsCount(activeRecords.length);

      // Call Gemini to synthesize
      try {
        const result = await synthesizeLongitudinalHistory(activeRecords);
        setSynthesis(result);
        setLoading(false);
      } catch (err: any) {
        setError("AI Synthesis failed: " + err.message);
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [code]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping opacity-50" />
          <div className="w-16 h-16 bg-white border border-indigo-100 rounded-full flex items-center justify-center shadow-lg relative z-10 text-indigo-600">
             <Loader2 size={24} className="animate-spin" />
          </div>
        </div>
        <div className="text-center">
           <h2 className="text-xl font-semibold text-slate-900 mb-2">Orchestrating Memory Layer</h2>
           <p className="text-slate-500 max-w-sm">
             Securely decrypting records and generating real-time clinical synthesis using Gemini 1.5 Pro.
           </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-4 border-t-4 border-t-red-500">
          <AlertTriangle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-600">{error}</p>
          <div className="pt-4">
             <Link to="/doctor" className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition inline-block">Return to Portal</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 bg-slate-50 relative">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-4 px-6 md:px-8 border-b border-slate-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link to="/doctor" className="p-2 hover:bg-white/10 rounded-full transition"><ArrowLeft size={18} /></Link>
              <div>
                 <div className="flex items-center gap-2">
                   <h1 className="text-xl font-semibold">Patient Summary</h1>
                   <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded border border-indigo-500/30 font-mono tracking-wider">CODE: {code}</span>
                 </div>
                 <p className="text-xs text-slate-400 mt-0.5">Synthesized from {rawRecordsCount} longitudinal records</p>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
         
         <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
           <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
             <ActivitySquare size={16} /> Clinical Overview
           </h2>
           <p className="text-lg md:text-xl text-slate-800 leading-relaxed font-serif">
             {synthesis?.clinicalSummary}
           </p>
         </section>

         <div className="grid md:grid-cols-2 gap-8">
            <section className="bg-rose-50/50 rounded-2xl p-6 border border-rose-100">
               <h2 className="text-xs font-bold tracking-widest text-rose-500 uppercase mb-4 flex items-center gap-2">
                 <AlertTriangle size={16} /> Chronic & Compounding Risks
               </h2>
               <div className="space-y-3">
                 {synthesis?.chronicRisks?.map((risk:string, i:number) => (
                   <div key={i} className="flex gap-3 bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                      <div className="mt-0.5 text-rose-500"><ActivitySquare size={16} /></div>
                      <p className="text-slate-800 text-sm leading-relaxed">{risk}</p>
                   </div>
                 ))}
               </div>
            </section>

            <div className="space-y-8">
               <section className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                  <h2 className="text-xs font-bold tracking-widest text-indigo-500 uppercase mb-4 flex items-center gap-2">
                    <Pill size={16} /> Medication Patterns
                  </h2>
                  <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm text-sm text-slate-800 leading-relaxed font-mono">
                    {synthesis?.medicationPatterns}
                  </div>
               </section>

               <section className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                  <h2 className="text-xs font-bold tracking-widest text-emerald-600 uppercase mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Treatment Response
                  </h2>
                  <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm text-sm text-slate-800 leading-relaxed">
                    {synthesis?.treatmentResponse}
                  </div>
               </section>
            </div>
         </div>

      </div>
    </div>
  );
}
