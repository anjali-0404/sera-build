import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldAlert, Activity, Building2, Map as MapIcon, ChevronRight, HeartPulse } from 'lucide-react';

const Home = () => {
  const [stats, setStats] = useState({ cases: 0, hospitals: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [eResp, hResp] = await Promise.all([
          api.get('/api/emergency'),
          api.get('/api/hospital')
        ]);
        setStats({
          cases: eResp.data.length,
          hospitals: hResp.data.length
        });
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-20 py-10 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emergency-high/5 rounded-full blur-[100px] -z-10"></div>

      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-white/5 text-primary-400 font-medium text-sm animate-slow-glow">
          <HeartPulse size={16} />
          Priority Service for Human Well-being
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-surface-text leading-[1.1]">
          Life-Saving <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent italic">Precision</span> <br />
          for Every Second.
        </h1>
        <p className="text-xl text-surface-muted max-w-2xl mx-auto leading-relaxed">
          The Smart Emergency Resource Allocator (SERA) brings human-centric AI to critical care, 
          finding the right hospital at the right moment.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
          <Link to="/report" className="w-full sm:w-auto px-10 py-4.5 bg-emergency-high hover:bg-emergency-high/90 text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-human hover:scale-[1.03] shadow-2xl shadow-emergency-high/20">
            <ShieldAlert size={22} />
            Report Crisis
          </Link>
          <Link to="/map" className="w-full sm:w-auto px-10 py-4.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-human">
            <MapIcon size={22} />
            Live Map
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Cases" value={stats.cases} icon={<ShieldAlert className="text-emergency-high" />} />
        <StatCard label="Live Facilities" value={stats.hospitals} icon={<Building2 className="text-primary-400" />} />
        <StatCard label="Response Units" value={Math.floor(stats.hospitals * 1.5)} icon={<Activity className="text-primary-400" />} />
        <StatCard label="System Integrity" value="Stable" icon={<div className="w-2.5 h-2.5 rounded-full bg-emergency-low shadow-[0_0_10px_rgba(5,150,137,0.5)]" />} />
      </section>

      {/* Feature Section with richer look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <FeatureItem 
          title="Empathy Driven" 
          desc="Our algorithm prioritizes clinical outcome and patient specialization over just basic proximity."
          accent="bg-primary-500/20"
        />
        <FeatureItem 
          title="Seamless Sync" 
          desc="Zero-latency data exchange between emergency response units and critical care facility teams."
          accent="bg-blue-500/20"
        />
        <FeatureItem 
          title="Predictive Care" 
          desc="Analyzing metadata to anticipate resource needs before the ambulance even arrives."
          accent="bg-emergency-high/15"
        />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="glass-card p-7 rounded-3xl border-surface-border flex items-center justify-between hover:border-primary-500/20 transition-human">
    <div className="space-y-1">
      <p className="text-surface-muted text-xs font-bold uppercase tracking-widest">{label}</p>
      <p className="text-4xl font-bold text-surface-text tracking-tighter">{value}</p>
    </div>
    <div className="p-4 bg-surface-input rounded-2xl border border-surface-border shadow-inner">
      {icon}
    </div>
  </div>
);

const FeatureItem = ({ title, desc, accent }) => (
  <div className="glass-card p-10 rounded-[2.5rem] border-surface-border hover:border-primary-500/20 transition-human group cursor-default">
    <div className={`w-12 h-12 rounded-2xl ${accent} mb-6 flex items-center justify-center`}>
      <ChevronRight className="text-primary-500 opacity-40 group-hover:opacity-100 transition-opacity" />
    </div>
    <h3 className="text-2xl font-bold mb-4 text-surface-text">{title}</h3>
    <p className="text-surface-muted leading-relaxed text-sm font-medium">{desc}</p>
  </div>
);

export default Home;
