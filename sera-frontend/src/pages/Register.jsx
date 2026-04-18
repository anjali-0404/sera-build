import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, Lock, User, UserPlus, ShieldPlus, Loader2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Email might already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="glass-card w-full max-w-md p-10 rounded-[3rem] space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-2">
            <ShieldPlus className="text-emerald-500" size={28} />
          </div>
          <h1 className="text-3xl font-black text-surface-text tracking-tighter">New Unit Enrollment</h1>
          <p className="text-surface-muted text-sm font-medium">Register your facility to the SERA Global Network.</p>
        </div>

        {error && (
          <div className="p-4 bg-emergency-high/10 border border-emergency-high/20 rounded-2xl text-emergency-high text-xs font-bold flex items-center gap-3">
            <Mail size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-muted ml-1">Full Name / Facility Title</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-muted" size={18} />
              <input 
                type="text" required
                className="w-full bg-surface-input border border-surface-border rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-primary-500/50 transition-human text-surface-text"
                placeholder="Central Hospital Dept."
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-muted ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-muted" size={18} />
              <input 
                type="email" required
                className="w-full bg-surface-input border border-surface-border rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-primary-500/50 transition-human text-surface-text"
                placeholder="admin@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-muted ml-1">Access Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-muted" size={18} />
              <input 
                type="password" required
                className="w-full bg-surface-input border border-surface-border rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-primary-500/50 transition-human text-surface-text"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-human shadow-xl shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
            {loading ? 'REGISTERING...' : 'ENROLL UNIT'}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-surface-muted text-sm font-medium">
            Already registered? <Link to="/login" className="text-emerald-500 hover:underline">Access your account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
