import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Activity, ShieldCheck, ArrowRight, Brain } from 'lucide-react';
import { GlassCard, Button, Input } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { vitalityAgent } from '../lib/geminiClient';

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
    allergies: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // 1. Calculate Initial Health Vitality Score via Gemini
      const vitalityData = await vitalityAgent({
        ...formData,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight)
      });

      // 2. Persist to AXON Profile
      const { error } = await supabase
        .from('patients')
        .upsert({
          user_id: user.id,
          name: formData.name,
          dob: formData.dob,
          blood_type: formData.blood_type,
          height: parseFloat(formData.height) || null,
          weight: parseFloat(formData.weight) || null,
          activity_level: formData.activity_level,
          allergies: formData.allergies.split(',').map(a => a.trim()).filter(Boolean),
          health_vitality_score: vitalityData.vitality_score,
          health_score_explanation: vitalityData.explanation,
          improvement_areas: vitalityData.improvement_areas
        });

      if (error) throw error;
      await refreshProfile();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-brand-blue/10 rounded-2xl mb-4 border border-brand-blue/20">
            <Brain className="w-8 h-8 text-brand-blue" />
          </div>
          <h1 className="text-4xl font-bold font-display tracking-tight">Establish AXON Baseline</h1>
          <p className="text-slate-400 mt-2">Initialize your intelligence-driven clinical profile.</p>
        </div>

        <GlassCard className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Full Name" 
                placeholder="Dr. John Doe" 
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
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-medium text-slate-400">Blood Group</label>
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
              <Input 
                label="Height (cm)" 
                type="number"
                placeholder="175"
                value={formData.height}
                onChange={e => setFormData({ ...formData, height: e.target.value })}
              />
              <Input 
                label="Weight (kg)" 
                type="number"
                placeholder="70"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 text-left">
                <label className="text-sm font-medium text-slate-400">Activity Level</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/50 transition-all font-medium"
                  value={formData.activity_level}
                  onChange={e => setFormData({ ...formData, activity_level: e.target.value })}
                >
                  <option value="sedentary" className="bg-slate-900">Sedentary (No exercise)</option>
                  <option value="moderate" className="bg-slate-900">Moderate (1-3 days/wk)</option>
                  <option value="active" className="bg-slate-900">Active (3-5 days/wk)</option>
                  <option value="athletic" className="bg-slate-900">Athletic (6-7 days/wk)</option>
                </select>
              </div>
              <Input 
                label="Known Allergies" 
                placeholder="Penicillin, Pollen..." 
                value={formData.allergies}
                onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full h-14 text-lg" loading={loading}>
              {loading ? 'Orchestrating AI Health Score...' : 'Finalize Profile'}
              {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
