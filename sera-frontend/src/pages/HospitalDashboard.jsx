import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Bed, Activity, Ambulance, Filter, Search, Loader2, MapPin, Grid2X2 } from 'lucide-react';

const HospitalDashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const resp = await api.get('/api/hospital');
      setHospitals(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-500/10 border border-primary-500/20 text-[10px] font-black text-primary-500 uppercase tracking-widest pl-1">
            <Grid2X2 size={12} />
            India Medical Grid Monitor
          </div>
          <h1 className="text-5xl font-black text-surface-text tracking-tighter">Care Facilities</h1>
          <p className="text-surface-muted text-lg max-w-xl font-medium">
            Real-time monitoring of clinical resources and bed availability across major Indian healthcare hubs.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-muted group-focus-within:text-primary-500 transition-human" size={18} />
            <input 
              type="text" 
              placeholder="Search by city or facility..." 
              className="bg-surface-input border border-surface-border rounded-2xl py-4.5 pl-12 pr-6 outline-none focus:border-primary-500/50 focus:bg-surface-bg transition-human w-full md:w-96 text-sm font-bold text-surface-text placeholder:text-surface-muted shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-4 bg-surface-input border border-surface-border rounded-2xl hover:bg-surface-bg transition-human text-surface-muted hover:text-surface-text shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 animate-pulse">
          <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-surface-muted font-black uppercase tracking-widest text-[10px]">Synchronizing Resource Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredHospitals.map((hospital) => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
          {filteredHospitals.length === 0 && (
            <div className="col-span-full py-24 text-center glass-card rounded-[3rem] border-dashed border-surface-border">
              <p className="text-surface-muted font-bold">No facilities found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const HospitalCard = ({ hospital }) => {
  return (
    <div className="glass-card rounded-[3rem] p-8 hover:border-primary-500/20 transition-human group relative overflow-hidden bg-surface-bg/50 backdrop-blur-xl">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-human"></div>

      <div className="relative space-y-8">
        <div className="flex items-start justify-between">
          <div className="p-4 bg-surface-input rounded-2xl border border-surface-border shadow-inner group-hover:bg-primary-500/10 transition-human">
            <Building2 className="text-primary-500" size={28} />
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.15em] uppercase border shadow-sm ${
            hospital.availableBeds > 50 
              ? 'text-emergency-low border-emerald-500/20 bg-emerald-500/5' 
              : 'text-emergency-medium border-amber-500/20 bg-amber-500/5'
          }`}>
            {hospital.availableBeds > 50 ? 'Stable' : 'High Load'}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-surface-text group-hover:text-primary-500 transition-human tracking-tighter">{hospital.name}</h3>
          <div className="flex items-center gap-1.5 text-surface-muted font-bold text-xs uppercase tracking-widest">
            <MapPin size={12} className="text-primary-500/50" />
            {hospital.city} Hub
          </div>
        </div>

        <div className="space-y-6">
          <ResourceMetric label="General Care" current={hospital.availableBeds} total={hospital.totalBeds} icon={<Bed size={16} />} color="bg-primary-500" />
          <ResourceMetric label="Intensive Care (ICU)" current={hospital.availableICU} total={hospital.totalICU} icon={<Activity size={16} />} color="bg-emergency-high" />
          
          <div className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-input rounded-xl flex items-center justify-center border border-surface-border group-hover:bg-primary-500/10 transition-human">
                <Ambulance size={18} className="text-primary-500" />
              </div>
              <span className="text-[10px] text-surface-muted font-black uppercase tracking-widest">Active Units</span>
            </div>
            <span className="text-2xl font-black text-surface-text tracking-tighter">{hospital.ambulances}</span>
          </div>
        </div>

        <div className="pt-6 border-t border-surface-border/50">
          <div className="flex flex-wrap gap-2">
            {hospital.specializations.split(',').map((spec, i) => (
              <span key={i} className="text-[10px] bg-surface-input px-3 py-1.5 rounded-xl text-surface-muted font-black uppercase tracking-wider border border-surface-border hover:border-primary-500/20 hover:text-surface-text transition-human cursor-default">
                {spec.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResourceMetric = ({ label, current, total, icon, color }) => {
  const percentage = (current / total) * 100;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2 text-surface-muted">
          <span className="text-primary-500/50">{icon}</span>
          <span>{label}</span>
        </div>
        <span className="text-surface-text">{current} <span className="text-surface-muted font-bold">/ {total}</span></span>
      </div>
      <div className="h-2 bg-surface-input rounded-full overflow-hidden p-[1px] shadow-inner border border-surface-border">
        <div 
          className={`h-full ${color} rounded-full transition-human shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
