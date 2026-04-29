import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Brain, 
  Shield, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  LogOut,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut, patient } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Health Hub', path: '/dashboard' },
    { icon: Database, label: 'Clinical Vault', path: '/vault' },
    { icon: Brain, label: 'AI Insights', path: '/dashboard' }, // Links to hub sections
    { icon: Shield, label: 'Security & Access', path: '/vault' }, // Links to vault for now
    { icon: History, label: 'Audit Trail', path: '/architecture' },
  ];

  return (
    <motion.div 
      animate={{ width: isCollapsed ? 80 : 260 }}
      className="relative flex flex-col h-screen border-r border-white/5 bg-slate-950/50 backdrop-blur-xl transition-all z-40"
    >
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-brand-blue p-1 rounded-full text-white shadow-lg z-50 hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand */}
      <div className={clsx("h-16 flex items-center px-6 mb-8", isCollapsed ? "justify-center" : "justify-start gap-3")}>
        <div className="bg-gradient-brand p-1.5 rounded-lg shrink-0">
          <Activity className="w-6 h-6 text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-2xl font-bold font-display tracking-tight text-white">AXON</span>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            className={({ isActive }) => clsx(
              "flex items-center gap-4 px-3 py-3 rounded-xl transition-all group",
              isActive 
                ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className={clsx("shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
            {!isCollapsed && <span className="font-medium text-sm tracking-wide">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Profile / Bottom */}
      <div className="p-4 border-t border-white/5">
        {!isCollapsed && (
          <div className="flex items-center gap-3 p-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-brand-blue border border-white/10">
              {patient?.name?.charAt(0) || 'P'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{patient?.name || 'Patient'}</span>
              <span className="text-[10px] text-slate-500 font-mono">ENCRYPTED_ID</span>
            </div>
          </div>
        )}
        <button 
          onClick={() => signOut()}
          className={clsx(
            "w-full flex items-center gap-4 px-3 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="text-sm font-medium">Log out</span>}
        </button>
      </div>
    </motion.div>
  );
};
