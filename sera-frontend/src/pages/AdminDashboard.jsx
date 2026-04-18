import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { ShieldAlert, Building2, Activity, Clock, Search, ArrowUpRight, LayoutDashboard, Download, CheckCircle2 } from 'lucide-react';

const AdminDashboard = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eResp, hResp] = await Promise.all([
          api.get('/api/emergency'),
          api.get('/api/hospital')
        ]);
        setEmergencies(eResp.data);
        setHospitals(hResp.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Chart data
  const timeData = [
    { name: '00:00', cases: 4 },
    { name: '04:00', cases: 2 },
    { name: '08:00', cases: 8 },
    { name: '12:00', cases: 15 },
    { name: '16:00', cases: 12 },
    { name: '20:00', cases: 10 },
  ];

  const hospitalData = hospitals.slice(0, 5).map(h => ({
    name: h.name.split(' ')[0],
    beds: h.totalBeds,
    icu: h.icuBeds
  }));

  // Filtered emergencies
  const filteredEmergencies = emergencies.filter(e =>
    e.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.emergencyType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.severity?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export Insights handler
  const handleExport = () => {
    if (emergencies.length === 0) {
      alert('No emergency data available to export.');
      return;
    }

    const csvHeaders = ['ID', 'Patient Name', 'Age', 'Emergency Type', 'Severity', 'Status', 'Contact', 'Description', 'Latitude', 'Longitude', 'Allocated Hospital', 'Timestamp'];
    const csvRows = emergencies.map(e => [
      e.id,
      `"${e.patientName || ''}"`,
      e.age || '',
      e.emergencyType || '',
      e.severity || '',
      e.status || '',
      e.contact || '',
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.latitude || '',
      e.longitude || '',
      `"${e.allocatedHospital || 'Unallocated'}"`,
      e.createdAt ? new Date(e.createdAt).toLocaleString() : ''
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SERA_Emergency_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const criticalCount = emergencies.filter(e => e.severity === 'CRITICAL').length;
  const allocatedCount = emergencies.filter(e => e.status === 'ALLOCATED').length;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary-500 font-bold text-[10px] uppercase tracking-widest pl-1">
             <LayoutDashboard size={12} />
             System Command Center
          </div>
          <h1 className="text-4xl font-black text-surface-text tracking-tighter">Medical Grid Analytics</h1>
          <p className="text-surface-muted font-medium">Holistic view of emergency activities and system health across India.</p>
        </div>
        <button
          onClick={handleExport}
          className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center gap-3 self-start md:self-center ${
            exportSuccess
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/20'
          }`}
        >
          {exportSuccess ? <CheckCircle2 size={18} /> : <Activity size={18} />}
          {exportSuccess ? 'Exported!' : 'Export Insights'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Total Incidents" value={emergencies.length} sub="All time" color="text-primary-500" />
        <KpiCard label="Allocated" value={allocatedCount} sub="Dispatched" color="text-emerald-500" />
        <KpiCard label="Critical" value={criticalCount} sub="High priority" color="text-red-500" />
        <KpiCard label="Hospitals" value={hospitals.length} sub="In system" color="text-blue-400" />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border-surface-border bg-surface-bg/50 backdrop-blur-xl">
          <h3 className="text-xl font-black text-surface-text mb-10 tracking-tight">Emergency Load (Last 24h)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-surface-muted)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="var(--color-surface-muted)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface-input)', border: '1px solid var(--color-surface-border)', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-surface-text)' }}
                  itemStyle={{ color: 'var(--color-primary-500)' }}
                />
                <Area type="monotone" dataKey="cases" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-10 rounded-[3rem] border-surface-border bg-surface-bg/50 backdrop-blur-xl">
          <h3 className="text-xl font-black text-surface-text mb-10 tracking-tight">Hospital Capacity</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-surface-muted)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--color-surface-muted)" fontSize={9} fontWeight="black" width={55} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface-input)', border: '1px solid var(--color-surface-border)', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                  cursor={{ fill: 'var(--color-surface-input)', opacity: 0.4 }}
                />
                <Bar dataKey="beds" name="Total Beds" fill="#14b8a6" radius={[0, 8, 8, 0]} barSize={14} />
                <Bar dataKey="icu" name="ICU Beds" fill="#f43f5e" radius={[0, 8, 8, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Dispatch Protocol Log */}
      <div className="glass-card rounded-[3rem] overflow-hidden border-surface-border bg-surface-bg/50 backdrop-blur-xl shadow-2xl shadow-black/5">
        <div className="p-10 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black text-surface-text tracking-tight">Live Dispatch Protocol Log</h3>
            <p className="text-[10px] text-surface-muted font-bold uppercase tracking-widest mt-1">{filteredEmergencies.length} records</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-muted group-focus-within:text-primary-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-surface-input border border-surface-border rounded-xl py-2.5 pl-12 pr-6 text-sm font-bold text-surface-text placeholder:text-surface-muted outline-none focus:border-primary-500/50 shadow-inner"
              />
            </div>
            <button
              onClick={handleExport}
              title="Download CSV"
              className="p-2.5 bg-surface-input border border-surface-border hover:border-primary-500/40 rounded-xl transition-human text-surface-muted hover:text-primary-500"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-input/50 text-surface-muted text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-10 py-5">Incident ID</th>
                <th className="px-10 py-5">Subject</th>
                <th className="px-10 py-5">Priority</th>
                <th className="px-10 py-5">Grid Status</th>
                <th className="px-10 py-5">Allocated To</th>
                <th className="px-10 py-5">Timestamp</th>
                <th className="px-10 py-5 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/30">
              {filteredEmergencies.map((emergency) => (
                <tr key={emergency.id} className="hover:bg-primary-500/[0.02] transition-colors group">
                  <td className="px-10 py-6 font-mono text-[10px] text-surface-muted font-black opacity-50 group-hover:opacity-100 italic transition-opacity">#{emergency.id}</td>
                  <td className="px-10 py-6">
                    <div className="font-black text-surface-text tracking-tight">{emergency.patientName}</div>
                    <div className="text-[10px] text-surface-muted font-bold uppercase tracking-widest">{emergency.emergencyType}</div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${
                      emergency.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                      emergency.severity === 'HIGH' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                      {emergency.severity}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-sm font-bold">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${emergency.status === 'ALLOCATED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary-500 animate-pulse'}`}></div>
                      <span className="text-surface-text text-xs uppercase tracking-widest font-black">{emergency.status}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-xs text-primary-400 font-bold">
                    {emergency.allocatedHospital || '—'}
                  </td>
                  <td className="px-10 py-6 text-xs text-surface-muted font-bold font-mono">
                    {new Date(emergency.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button className="p-3 hover:bg-primary-500/10 rounded-xl transition-human text-primary-500 border border-transparent hover:border-primary-500/20">
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmergencies.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                       <Clock size={40} className="text-surface-muted" />
                       <p className="text-surface-muted font-black uppercase tracking-widest text-[10px]">No dispatch protocols detected</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, sub, color }) => (
  <div className="glass-card p-7 rounded-3xl border-surface-border bg-surface-bg/50 backdrop-blur-xl hover:border-primary-500/20 transition-human">
    <p className="text-surface-muted text-[9px] font-black uppercase tracking-widest mb-2">{label}</p>
    <p className={`text-4xl font-black tracking-tighter ${color}`}>{value}</p>
    <p className="text-surface-muted text-[9px] font-bold uppercase tracking-widest mt-1">{sub}</p>
  </div>
);

export default AdminDashboard;
