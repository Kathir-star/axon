import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Brain, Zap, Clock, ClipboardList, ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';
import { Button, GlassCard } from '../components/ui';

const Home = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-blue/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-brand-purple/20 blur-[100px] rounded-full" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="info">Intelligence That Connects Your Health</Badge>
            <h1 className="mt-8 text-5xl md:text-8xl font-sans font-extrabold tracking-tight">
              AXON <br />
              <span className="text-gradient">Health. Connected.</span>
            </h1>
            <p className="mt-8 text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
              AXON is the neural-inspired patient memory layer. Where fragmented health data flows 
              intelligently into a unified, AI-driven longitudinal record.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg">
                  Patient Portal Access
                </Button>
              </Link>
              <Link to="/provider-access">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-10 text-lg">
                  Provider Access Portal
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Pulse Section */}
      <section className="py-24 border-t border-white/5 bg-slate-950/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold font-display">The AXON Intelligence Framework</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProblemCard 
              icon={<Shield className="w-8 h-8 text-brand-blue" />}
              title="Secure Access Layer"
              description="Zero-trust architecture utilizing 6-digit ephemeral vault codes for provider entry."
            />
            <ProblemCard 
              icon={<Brain className="w-8 h-8 text-brand-purple" />}
              title="Intelligence Engine"
              description="A multi-agent neural chain that synthesizes records into a Point-of-Care Summary."
            />
            <ProblemCard 
              icon={<Activity className="w-8 h-8 text-brand-cyan" />}
              title="Vitality Hub"
              description="Live calculation of your Health Vitality Score based on real-time clinical markers."
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
            <div className="bg-gradient-brand p-1.5 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">AXON</span>
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
