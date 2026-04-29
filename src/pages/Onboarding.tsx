import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Activity, ShieldCheck, ArrowRight, Brain, Camera } from 'lucide-react';
import { GlassCard, Button, Input } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { vitalityAgent } from '../lib/gemini';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    blood_type: 'Unknown',
    height: '',
    weight: '',
    activity_level: 'moderate',
    allergies: '',
    // New Clinical Baseline
    bp_systolic: '',
    bp_diastolic: '',
    heart_rate: '',
    blood_sugar: '',
    sleep_hours: '7',
    water_intake: '2',
    is_smoker: false,
    alcohol_freq: 'Never',
    family_history: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateClinicalId = () => {
    return `AXN-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // 1. Calculate Initial Health Vitality Score via Gemini
      const profileData = {
        ...formData,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        bp_systolic: parseInt(formData.bp_systolic),
        bp_diastolic: parseInt(formData.bp_diastolic),
        heart_rate: parseInt(formData.heart_rate),
        blood_sugar: parseInt(formData.blood_sugar),
        sleep_hours: parseFloat(formData.sleep_hours),
        water_intake: parseFloat(formData.water_intake),
        family_history: formData.family_history.split(',').map(h => h.trim()).filter(Boolean)
      };

      const vitalityData = await vitalityAgent(profileData);

      let uploadedImageUrl = null;
      if (profileFile) {
        const fileExt = profileFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        await supabase.storage
          .from('profile-pictures')
          .upload(fileName, profileFile);
          
        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);
          
        uploadedImageUrl = publicUrl;
      }

      // 2. Persist to AXON Profile
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('clinical_id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('patients')
        .upsert({
          user_id: user.id,
          clinical_id: existingPatient?.clinical_id || generateClinicalId(),
          name: formData.name,
          dob: formData.dob,
          blood_type: formData.blood_type,
          height: profileData.height || null,
          weight: profileData.weight || null,
          activity_level: formData.activity_level,
          allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean),
          
          // Clinical Baseline
          bp_systolic: profileData.bp_systolic || null,
          bp_diastolic: profileData.bp_diastolic || null,
          heart_rate: profileData.heart_rate || null,
          blood_sugar: profileData.blood_sugar || null,
          sleep_hours: profileData.sleep_hours || null,
          water_intake: profileData.water_intake || null,
          is_smoker: formData.is_smoker,
          alcohol_freq: formData.alcohol_freq,
          family_history: profileData.family_history,
          
          onboarding_complete: true,
          doctor_access_enabled: true,
          health_vitality_score: vitalityData.vitality_score,
          health_score_explanation: vitalityData.explanation,
          improvement_areas: vitalityData.improvement_areas,
          ...(uploadedImageUrl ? { profile_picture_url: uploadedImageUrl } : {})
        });

      if (error) throw error;
      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to finalize profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6 bg-slate-950 text-white flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, scale: 1,
              filter: ["drop-shadow(0 0 2px rgba(52,144,220,0.1))", "drop-shadow(0 0 10px rgba(52,144,220,0.4))", "drop-shadow(0 0 2px rgba(52,144,220,0.1))"]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.img 
               src="https://i.ibb.co/Cpsv0qY7/73024ef0-7fe4-4884-96b1-58af0a49ff7c.png" 
               alt="AXON Logo" 
               className="w-[90px] md:w-[140px] lg:w-[160px] object-contain mx-auto mb-6"
               whileHover={{ scale: 1.05 }}
               transition={{ duration: 0.2 }}
            />
          </motion.div>
          <h1 className="text-4xl font-bold font-display tracking-tight uppercase">Establish Baseline</h1>
          <p className="text-slate-400 mt-2">Initialize your intelligence-driven clinical profile for precision diagnostics.</p>
        </div>

        <GlassCard className="p-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Section 1: Identity */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-brand-blue flex items-center gap-2">
                <User className="w-5 h-5" /> Identity & Logistics
              </h3>
              
              <div className="flex justify-center mb-6">
                 <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-blue/30 bg-slate-800">
                       {profilePreview ? (
                         <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                       ) : (
                         <div className="flex items-center justify-center h-full text-slate-500 font-medium text-xs">No Image</div>
                       )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-brand-blue text-white rounded-full shadow-lg group-hover:scale-110 transition-transform"
                    >
                       <Camera className="w-4 h-4" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Full Name" 
                  placeholder="John Doe" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input 
                  label="Date of Birth" 
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400 text-left block">Blood Group</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/50 transition-all font-medium"
                    value={formData.blood_type}
                    onChange={e => setFormData({ ...formData, blood_type: e.target.value })}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'].map(t => (
                      <option key={t} value={t} className="bg-slate-900">{t}</option>
                    ))}
                  </select>
                </div>
                <Input label="Height (cm)" type="number" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
                <Input label="Weight (kg)" type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
              </div>
            </div>

            {/* Section 2: Clinical Vitals */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Clinical Vitals
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="BP Systolic" type="number" placeholder="120" value={formData.bp_systolic} onChange={e => setFormData({ ...formData, bp_systolic: e.target.value })} />
                  <Input label="BP Diastolic" type="number" placeholder="80" value={formData.bp_diastolic} onChange={e => setFormData({ ...formData, bp_diastolic: e.target.value })} />
                </div>
                <Input label="Heart Rate (BPM)" type="number" placeholder="72" value={formData.heart_rate} onChange={e => setFormData({ ...formData, heart_rate: e.target.value })} />
              </div>
              <Input label="Fasting Blood Sugar (mg/dL)" type="number" placeholder="95" value={formData.blood_sugar} onChange={e => setFormData({ ...formData, blood_sugar: e.target.value })} />
            </div>

            {/* Section 3: Lifestyle & History */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Lifestyle & Risk Factors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Sleep (Hrs/Day)" type="number" value={formData.sleep_hours} onChange={e => setFormData({ ...formData, sleep_hours: e.target.value })} />
                <Input label="Water (L/Day)" type="number" value={formData.water_intake} onChange={e => setFormData({ ...formData, water_intake: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                  <input 
                    type="checkbox" 
                    id="smoker"
                    className="w-5 h-5 accent-brand-blue" 
                    checked={formData.is_smoker} 
                    onChange={e => setFormData({ ...formData, is_smoker: e.target.checked })}
                  />
                  <label htmlFor="smoker" className="text-sm font-medium text-slate-300">Active Smoker</label>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-400 text-left block">Alcohol Frequency</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/50 transition-all font-medium"
                    value={formData.alcohol_freq}
                    onChange={e => setFormData({ ...formData, alcohol_freq: e.target.value })}
                  >
                    <option value="Never" className="bg-slate-900">Never</option>
                    <option value="Occasional" className="bg-slate-900">Occasional</option>
                    <option value="Regular" className="bg-slate-900">Regular</option>
                  </select>
                </div>
              </div>
              <Input 
                label="Family Biological History" 
                placeholder="Type 2 Diabetes (Father), Hypertension (Mother)..." 
                value={formData.family_history}
                onChange={e => setFormData({ ...formData, family_history: e.target.value })}
              />
              <Input 
                label="Known Allergies" 
                placeholder="Penicillin, Peanuts..." 
                value={formData.allergies}
                onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full h-14 text-lg" loading={loading}>
              {loading ? 'Orchestrating Neural Health Score...' : 'Activate AXON Identity'}
              {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
