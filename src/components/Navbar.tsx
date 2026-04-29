import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const { user, signOut, isDoctor } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const getDashboardLink = () => {
    if (isDoctor) return "/portal/doctor/access";
    return "/portal/patient/dashboard";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism-header h-16 flex items-center">
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? getDashboardLink() : "/"} className="flex items-center gap-2 group p-4 -ml-4">
          <motion.div
            animate={{ 
              opacity: [0.8, 1, 0.8],
              filter: ["drop-shadow(0 0 2px rgba(52,144,220,0.1))", "drop-shadow(0 0 12px rgba(52,144,220,0.4))", "drop-shadow(0 0 2px rgba(52,144,220,0.1))"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src="https://i.ibb.co/Cpsv0qY7/73024ef0-7fe4-4884-96b1-58af0a49ff7c.png" alt="AXON Logo" className="h-12 object-contain" />
          </motion.div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-sans">
          <NavLink to="/" className={({ isActive }) => `text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-white'}`}>
            Memory Layer
          </NavLink>
          <NavLink to="/architecture" className={({ isActive }) => `text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-white'}`}>
            Architecture
          </NavLink>
          <NavLink to="/portal/doctor/access" className={({ isActive }) => `text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-white'}`}>
            Provider Access
          </NavLink>
        </div>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to={getDashboardLink()}>
                <Button size="sm" variant="outline" className="text-[10px] uppercase font-bold tracking-widest h-9 border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white">
                  Health Hub
                </Button>
              </Link>
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
              <Button size="sm" className="gap-2 text-[10px] uppercase font-bold tracking-widest h-9">
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
            <Link to="/portal/doctor/access" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-slate-400">For Doctors</Link>
            <div className="h-px bg-white/5 my-2" />
            {user ? (
              <Link to={getDashboardLink()} onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-brand-blue">My Health Dashboard</Link>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-brand-blue">Sign In</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
