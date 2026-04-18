import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, ShieldAlert, Building2, LayoutDashboard, Map as MapIcon, 
  HeartPulse, Sun, Moon, LogOut, User as UserIcon, LogIn 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Portal', icon: <HeartPulse size={18} /> },
    { path: '/report', label: 'Report', icon: <ShieldAlert size={18} /> },
    { path: '/hospitals', label: 'Facilities', icon: <Building2 size={18} /> },
    { path: '/map', label: 'Mapping', icon: <MapIcon size={18} /> },
    { path: '/admin', label: 'System', icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <nav className="glass-navbar sticky top-0 z-50 px-8 py-4 transition-human">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold text-surface-text tracking-tighter group">
          <div className="p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/20 shadow-inner group-hover:scale-105 transition-human">
            <HeartPulse className="text-primary-500" size={24} />
          </div>
          <span className="hidden sm:inline">SERA <span className="text-primary-500 text-sm font-black italic tracking-normal ml-0.5">Core</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-human ${
                location.pathname === item.path
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/10'
                  : 'text-surface-muted hover:text-surface-text hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-3 bg-surface-input border border-surface-border rounded-xl text-surface-text hover:bg-primary-500/10 hover:text-primary-400 transition-human shadow-sm"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="h-8 w-[1px] bg-surface-border mx-1"></div>

          {/* Auth Actions */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-muted">Active Session</span>
                <span className="text-xs font-bold text-surface-text">{user.name}</span>
              </div>
              <button 
                onClick={logout}
                className="p-3 bg-emergency-high/5 border border-emergency-high/20 rounded-xl text-emergency-high hover:bg-emergency-high/10 transition-human"
                title="Secure Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-human shadow-lg shadow-primary-500/20"
            >
              <LogIn size={18} />
              <span className="hidden md:inline">Access Grid</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
