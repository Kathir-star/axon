import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Shield, Brain, Zap, Clock, ClipboardList, ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';
import { Button, GlassCard } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ThreeBackground } from '../components/ThreeBackground';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-transparent">
      <ThreeBackground />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-40">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[700px] h-[700px] bg-brand-blue/10 blur-[140px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Badge variant="info">Intelligence That Respects Your History</Badge>
            <h1 className="mt-8 text-7xl md:text-[9rem] font-sans font-extrabold tracking-tight leading-[0.9]">
              AXON <br />
              <span className="text-gradient text-4xl md:text-6xl block mt-6 font-display">Universal Health Memory.</span>
            </h1>
            <p className="mt-12 text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
              AXON connects your fragmented records into a single, intelligent vault 
              that stays with you forever. Your data. Your control. Secure and simple.
            </p>
            
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/login?role=patient" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-20 px-14 text-xl shadow-[0_0_30px_rgba(52,144,220,0.3)] group uppercase tracking-widest">
                  Patient Portal
                  <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login?role=doctor" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-20 px-14 text-xl border-white/10 hover:bg-white/5 group uppercase tracking-widest">
                  Doctor Login
                  <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Pulse Section */}
      <section className="py-40 border-t border-white/5 bg-slate-950/40 relative z-10 backdrop-blur-3xl">
        <div className="container mx-auto px-6">
          <div className="text-center mb-32">
            <h2 className="text-5xl md:text-6xl font-bold font-display tracking-tight text-white">The Health Network Reinvented</h2>
            <p className="text-slate-500 mt-6 text-xl font-light">Breaking data silos with neural patient-centric architecture.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <ProblemCard 
              icon={<Shield className="w-10 h-10 text-brand-blue" />}
              title="Doctor's Key"
              description="Doctors only access your vault when you provide a 6-digit Doctor's Key. Access is temporary and fully auditable."
            />
            <ProblemCard 
              icon={<Brain className="w-10 h-10 text-brand-purple" />}
              title="My Health Vault"
              description="A permanent, clinical-grade profile that follows you from birth. No more lost records or repeated tests."
            />
            <ProblemCard 
              icon={<Activity className="w-10 h-10 text-brand-cyan" />}
              title="Intelligence Brief"
              description="Our AI agents synthesize years of clinical history into high-fidelity briefs for point-of-care efficiency."
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl font-bold">Futuristic Health Memory</h2>
            <p className="text-slate-400 mt-4">AXON transmits information intelligently across the care continuum.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Brain className="w-6 h-6 text-brand-purple" />}
              title="AXON Intelligence Engine"
              description="Proprietary agency layer summarizing fragmented health data into actionable clinician briefs."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-brand-blue" />}
              title="Ephemeral Vault Codes"
              description="Grant doctors 15-minute read access to your clinical vault. You own the private key."
            />
            <FeatureCard 
              icon={<Clock className="w-6 h-6 text-emerald-400" />}
              title="Clinical Baseline"
              description="Calculated Health Vitality Score based on chronic data and activity vectors."
            />
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-brand-cyan" />}
              title="Neural Connectivity"
              description="Seamless data flow between disparate EHR systems normalized into JSON schemas."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-400" />}
              title="Point-of-Care Recovery"
              description="Instant retrieval of medication interaction risks during critical care encounters."
            />
            <FeatureCard 
              icon={<ClipboardList className="w-6 h-6 text-slate-400" />}
              title="Immutable Audit Trail"
              description="Blockchain-inspired logs of every access attempt and record modification."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-slate-950/40">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <motion.img 
               src="https://i.ibb.co/Cpsv0qY7/73024ef0-7fe4-4884-96b1-58af0a49ff7c.png" 
               alt="AXON Logo" 
               className="w-[90px] md:w-[120px] object-contain" 
               whileHover={{ scale: 1.05 }}
            />
          </div>
          
          <div className="flex gap-8 text-sm text-slate-500 font-medium">
            <Link to="/architecture" className="hover:text-white">Architecture</Link>
            <a href="#" className="hover:text-white">Privacy Protocol</a>
            <a href="#" className="hover:text-white">Terms of Entry</a>
          </div>
          
          <div className="flex gap-4">
            <Twitter className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
            <Linkedin className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
            <Github className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer" />
          </div>
        </div>
        <div className="container mx-auto px-6 mt-8 text-center text-xs text-slate-600">
          © 2026 AXON. All rights reserved. Intelligent health data connectivity system.
        </div>
      </footer>
    </div>
  );
};

const ProblemCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <GlassCard className="flex flex-col gap-4 border-none bg-white/[0.02]">
    <div className="p-3 bg-white/5 w-fit rounded-2xl">{icon}</div>
    <h3 className="text-xl font-bold">{title}</h3>
    <p className="text-slate-400 font-light">{description}</p>
  </GlassCard>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <GlassCard className="group">
    <div className="flex items-start gap-4">
      <div className="mt-1 p-2 bg-white/5 rounded-lg group-hover:bg-brand-blue/10 transition-colors">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-lg">{title}</h4>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </GlassCard>
);

const Badge = ({ children, variant = 'info' }: { children: React.ReactNode, variant?: 'info' }) => (
  <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-brand-blue/10 text-brand-blue border border-brand-blue/20 inline-block mb-4">
    {children}
  </span>
);

export default Home;
