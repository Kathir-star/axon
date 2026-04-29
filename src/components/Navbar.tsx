import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Activity, Menu, X, ArrowRight, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism-header h-16 flex items-center">
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-brand p-1.5 rounded-lg group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold font-display tracking-tight text-white italic">AXON</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-sans">
          <NavLink to="/" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-white'}`}>
            Memory Layer
          </NavLink>
          <NavLink to="/architecture" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-white'}`}>
            AXON Architecture
          </NavLink>
          <NavLink to="/provider-access" className={({ isActive }) => `text-xs font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-white'}`}>
            Clinical View
          </NavLink>
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => signOut()}
                className="p-2 border border-white/5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="gap-2">
                Patient Login <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-slate-400" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-slate-950 border-b border-white/5 p-6 flex flex-col gap-4 md:hidden"
          >
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-400">Home</Link>
            <Link to="/architecture" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-400">Architecture</Link>
            <Link to="/doctor" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-400">For Doctors</Link>
            <div className="h-px bg-white/5 my-2" />
            {user ? (
              <Link to="/patient" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-brand-blue">My Health Dashboard</Link>
            ) : (
              <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-brand-blue">Sign In</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
