import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldAlert, MapPin, Phone, User, FileText, ChevronRight, 
  CheckCircle2, Loader2, Info, LocateFixed, Navigation 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Internal component to handle map clicks
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ReportEmergency = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [allocation, setAllocation] = useState(null);
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    emergencyType: 'Accident',
    severity: 'MEDIUM',
    latitude: 20.5937, // India Default
    longitude: 78.9629,
    description: '',
    contact: ''
  });

  const handleLocationSelect = (lat, lng) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const locateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        alert("Unable to retrieve your location. Please select manually on the map.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await api.post('/api/emergency', formData);
      const emergencyId = resp.data.id;
      
      const allocResp = await api.get(`/api/allocate/${emergencyId}`);
      setAllocation(allocResp.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("System connection error. Please verify the medical grid is online.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <CheckCircle2 size={56} className="text-emerald-500" />
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-5xl font-bold text-surface-text tracking-tight">Allocation Secured</h2>
          <p className="text-surface-muted text-lg font-medium">The medical grid has assigned the most compatible facility for the emergency.</p>
        </div>
        
        <div className="glass-card p-10 rounded-[3rem] text-left border-emerald-500/10 shadow-emerald-500/5 bg-surface-bg/50 backdrop-blur-xl">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-surface-text">
            <ShieldAlert className="text-primary-500" />
            Dispatch Details
          </h3>
          <div className="grid grid-cols-2 gap-10">
            <ResultItem label="Assigned Facility" value={allocation?.hospitalName || "Nearby Hub"} iconColor="text-primary-500" />
            <ResultItem label="Estimated ETA" value={`${allocation?.eta || 12} minutes`} iconColor="text-emerald-500" />
            <ResultItem label="Distance" value={`${allocation?.distance?.toFixed(2) || 0} km`} />
            <ResultItem label="Selection Score" value={`${allocation?.score?.toFixed(1) || 0}/100`} />
          </div>
          <div className="mt-10 p-6 bg-surface-input rounded-2xl border border-surface-border relative">
            <div className="absolute top-0 right-0 p-3 opacity-20 text-surface-muted">
              <Info size={16} />
            </div>
            <p className="text-[10px] text-surface-muted font-bold uppercase tracking-[0.2em] mb-2">Allocator Insight</p>
            <p className="text-surface-text leading-relaxed italic font-medium">"{allocation?.reason}"</p>
          </div>
        </div>
        
        <button 
          onClick={() => { setSubmitted(false); setAllocation(null); }}
          className="px-8 py-4 bg-surface-input hover:bg-surface-border text-surface-muted hover:text-surface-text font-black text-xs uppercase tracking-widest rounded-2xl transition-human border border-surface-border"
        >
          Return to Reporting Portal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-6">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 text-primary-500 font-bold text-[10px] uppercase tracking-widest pl-1">
          <ShieldAlert size={14} />
          Emergency Intake Portal
        </div>
        <h1 className="text-5xl font-black text-surface-text tracking-tighter">Report Incident</h1>
        <p className="text-surface-muted text-lg font-medium">Selecting your precise location ensures the dispatcher selects the absolute nearest facility.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Map Location Selector */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-6">
          <div className="glass-card rounded-[3.5rem] border-surface-border overflow-hidden h-[500px] relative group shadow-2xl shadow-black/10 transition-human hover:shadow-primary-500/5">
            <MapContainer center={[formData.latitude, formData.longitude]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              <Marker position={[formData.latitude, formData.longitude]} />
            </MapContainer>
            
            <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
              <button 
                type="button"
                onClick={locateUser}
                className="flex items-center gap-3 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-human shadow-xl shadow-primary-500/30 group/btn"
              >
                <LocateFixed size={18} className="group-hover/btn:rotate-12 transition-transform" />
                Auto-Detect Location
              </button>
              <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[9px] font-black uppercase text-slate-800 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-left-2 duration-500">
                Click map to refine dispatch point
              </div>
            </div>

            <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg text-xs font-bold text-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Grid Coordinates</p>
              <p className="flex justify-between gap-4"><span>Lat:</span> <span>{formData.latitude.toFixed(6)}</span></p>
              <p className="flex justify-between gap-4"><span>Lng:</span> <span>{formData.longitude.toFixed(6)}</span></p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-8">
          <div className="glass-card p-10 rounded-[3.5rem] border-surface-border space-y-8 bg-surface-bg/50 backdrop-blur-xl shadow-2xl shadow-black/5">
            <div className="space-y-6">
               <FormField label="Patient Details" icon={<User size={18} />}>
                  <div className="grid grid-cols-3 gap-4">
                    <input 
                      type="text" required 
                      className="col-span-2 bg-surface-input border border-surface-border rounded-xl py-4 px-5 focus:border-primary-500/50 outline-none transition-human text-surface-text font-bold placeholder:text-surface-muted shadow-inner text-sm"
                      placeholder="Name"
                      value={formData.patientName}
                      onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                    />
                    <input 
                      type="number" required
                      className="bg-surface-input border border-surface-border rounded-xl py-4 px-5 focus:border-primary-500/50 outline-none transition-human text-surface-text font-bold placeholder:text-surface-muted shadow-inner text-sm text-center"
                      placeholder="Age"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
               </FormField>

               <div className="grid grid-cols-2 gap-6">
                <FormField label="Category">
                  <select 
                    className="w-full bg-surface-input border border-surface-border rounded-xl py-4 px-5 focus:border-primary-500/50 outline-none transition-human text-surface-text font-bold shadow-inner appearance-none cursor-pointer text-sm"
                    value={formData.emergencyType}
                    onChange={(e) => setFormData({...formData, emergencyType: e.target.value})}
                  >
                    <option>Accident</option>
                    <option>Cardiac</option>
                    <option>Respiratory</option>
                    <option>Pediatric</option>
                    <option>Neurological</option>
                  </select>
                </FormField>
                <FormField label="Contact">
                   <input 
                    type="tel" required
                    className="w-full bg-surface-input border border-surface-border rounded-xl py-4 px-5 focus:border-primary-500/50 outline-none transition-human text-surface-text font-bold placeholder:text-surface-muted shadow-inner text-sm"
                    placeholder="999..."
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  />
                </FormField>
               </div>

               <FormField label="Severity Profile">
                  <div className="grid grid-cols-4 gap-2">
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({...formData, severity: level})}
                        className={`py-3 rounded-xl text-[9px] font-black tracking-widest transition-human border shadow-sm ${
                          formData.severity === level 
                            ? 'bg-primary-500/20 border-primary-500/40 text-primary-500' 
                            : 'bg-surface-input border-surface-border text-surface-muted hover:border-primary-500/30'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
               </FormField>

               <FormField label="Clinical Description" icon={<FileText size={18} />}>
                  <textarea 
                    rows="3"
                    className="w-full bg-surface-input border border-surface-border rounded-2xl py-4 px-5 focus:border-primary-500/50 outline-none transition-human text-surface-text font-bold placeholder:text-surface-muted shadow-inner resize-none text-sm"
                    placeholder="Describe symptoms..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
               </FormField>
            </div>

            <div className="pt-4">
              <button 
                disabled={loading}
                type="submit" 
                className="w-full py-5 bg-primary-500 hover:bg-primary-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 transition-human transform hover:scale-[1.02] shadow-2xl shadow-primary-500/30 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <ShieldAlert size={20} />}
                {loading ? 'ANALYZING PROXIMITY...' : 'DISPATCH REQUEST'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const FormField = ({ label, icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-surface-muted text-[9px] font-black uppercase tracking-[0.2em] ml-2">
      {icon}
      {label}
    </div>
    {children}
  </div>
);

const ResultItem = ({ label, value, iconColor = "text-surface-text" }) => (
  <div className="space-y-1">
    <p className="text-[10px] text-surface-muted font-bold uppercase tracking-wider">{label}</p>
    <p className={`text-xl font-black ${iconColor} tracking-tighter`}>{value}</p>
  </div>
);

export default ReportEmergency;
