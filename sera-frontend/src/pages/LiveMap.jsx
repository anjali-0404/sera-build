import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Compass, Navigation, Activity, AlertTriangle } from 'lucide-react';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: markerIcon, iconRetinaUrl: markerIconRetina, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const makeHospitalIcon = (color, glowColor, rank) => L.divIcon({
  html: `<div style="position:relative">
    <div style="background:${color};border:2.5px solid white;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px ${glowColor};z-index:1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>
    ${rank !== undefined ? `<div style="position:absolute;top:-6px;right:-6px;background:#f59e0b;color:white;border-radius:50%;width:18px;height:18px;font-size:9px;font-weight:900;display:flex;align-items:center;justify-content:center;border:1.5px solid white">${rank}</div>` : ''}
  </div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

const HospitalIcon = makeHospitalIcon('#10b981', 'rgba(16,185,129,0.5)');
const NearbyIcon1 = makeHospitalIcon('#f59e0b', 'rgba(245,158,11,0.7)', 1);
const NearbyIcon2 = makeHospitalIcon('#f97316', 'rgba(249,115,22,0.6)', 2);
const NearbyIcon3 = makeHospitalIcon('#3b82f6', 'rgba(59,130,246,0.6)', 3);

const EmergencyIcon = L.divIcon({
  html: `<div style="background:#ef4444;border:2.5px solid white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(239,68,68,0.6)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const UserLocationIcon = L.divIcon({
  html: `<div style="background:#14b8a6;border:3px solid white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 22px rgba(20,184,166,0.8)">
    <div style="width:12px;height:12px;background:white;border-radius:50%"></div>
  </div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Compute a zoom level that fits N nearest hospitals + user
function computeZoom(userPos, hospitals) {
  if (!hospitals.length) return 12;
  const lats = [userPos[0], ...hospitals.map(h => h.latitude)];
  const lngs = [userPos[1], ...hospitals.map(h => h.longitude)];
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  const maxSpan = Math.max(latSpan, lngSpan);
  if (maxSpan < 0.05)  return 14;
  if (maxSpan < 0.15)  return 13;
  if (maxSpan < 0.4)   return 12;
  if (maxSpan < 1.0)   return 11;
  if (maxSpan < 3.0)   return 9;
  return 7;
}

// Center between user and top hospitals
function midpoint(userPos, hospitals) {
  const all = [[userPos[0], userPos[1]], ...hospitals.map(h => [h.latitude, h.longitude])];
  return [all.reduce((s, p) => s + p[0], 0) / all.length, all.reduce((s, p) => s + p[1], 0) / all.length];
}

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [JSON.stringify(center), zoom]);
  return null;
};

const LiveMap = () => {
  const [hospitals, setHospitals] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);
  const [locating, setLocating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [nearbyCount] = useState(5); // show top 5 nearest

  const fetchData = useCallback(async () => {
    try {
      const [hResp, eResp] = await Promise.all([
        api.get('/api/hospital'),
        api.get('/api/emergency')
      ]);
      setHospitals(hResp.data);
      setEmergencies(eResp.data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Recompute nearby list when position or hospitals change
  useEffect(() => {
    if (!userPos || !hospitals.length) return;
    const sorted = hospitals
      .map(h => ({ ...h, distance: haversine(userPos[0], userPos[1], h.latitude, h.longitude) }))
      .sort((a, b) => a.distance - b.distance);
    setNearbyHospitals(sorted);
    // Auto-zoom to show user + top 3 nearest hospitals
    const top3 = sorted.slice(0, 3);
    const center = midpoint(userPos, top3);
    const zoom = computeZoom(userPos, top3);
    setMapCenter(center);
    setMapZoom(zoom);
  }, [userPos, hospitals]);

  const locateUser = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        alert('Location access denied. Please enable location in your browser.');
        setLocating(false);
      }
    );
  };

  const flyTo = (h) => {
    setMapCenter([h.latitude, h.longitude]);
    setMapZoom(14);
    setSelectedId(h.id);
  };

  const getHospitalIcon = (h) => {
    const rank = nearbyHospitals.findIndex(n => n.id === h.id);
    if (rank === 0) return NearbyIcon1;
    if (rank === 1) return NearbyIcon2;
    if (rank === 2) return NearbyIcon3;
    return HospitalIcon;
  };

  const nearestDist = nearbyHospitals[0]?.distance;

  return (
    <div style={{ height: 'calc(100vh - 130px)' }} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="inline-flex items-center gap-2 text-primary-500 font-bold text-[10px] uppercase tracking-widest">
            <Compass size={12} /> India Medical Grid Monitor
          </div>
          <h1 className="text-2xl font-black text-surface-text tracking-tighter">Live Resource Map</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={locateUser} disabled={locating}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-human shadow-lg shadow-primary-500/20">
            <LocateFixed size={16} className={locating ? 'animate-spin' : ''} />
            {locating ? 'Locating...' : 'Find My Location'}
          </button>
          <div className="flex gap-2 flex-wrap">
            <LegendItem color="#f59e0b" label="#1 Nearest" />
            <LegendItem color="#f97316" label="#2 Nearest" />
            <LegendItem color="#3b82f6" label="#3 Nearest" />
            <LegendItem color="#10b981" label="Hospital" />
            <LegendItem color="#ef4444" label="Emergency" />
          </div>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* MAP */}
        <div className="flex-1 rounded-[2rem] overflow-hidden glass-card border-surface-border relative min-h-0">
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* User dot */}
            {userPos && (
              <>
                <Marker position={userPos} icon={UserLocationIcon}>
                  <Popup><div className="p-2 font-bold text-sm text-center">📍 You are here</div></Popup>
                </Marker>
                <Circle center={userPos} radius={nearestDist ? nearestDist * 1000 : 20000}
                  pathOptions={{ color: '#14b8a6', weight: 1, fillColor: '#14b8a6', fillOpacity: 0.04, dashArray: '6 4' }} />
              </>
            )}

            {/* Hospitals */}
            {hospitals.map(h => {
              const dist = userPos ? haversine(userPos[0], userPos[1], h.latitude, h.longitude) : null;
              const nearbyRank = nearbyHospitals.findIndex(n => n.id === h.id);
              const isTop3 = nearbyRank >= 0 && nearbyRank < 3;
              return (
                <React.Fragment key={`h-${h.id}`}>
                  <Marker position={[h.latitude, h.longitude]} icon={getHospitalIcon(h)}>
                    <Popup maxWidth={250}>
                      <div className="p-3 min-w-[210px]">
                        <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b">
                          <h4 className="font-extrabold text-slate-900 text-sm">{h.name}</h4>
                          {isTop3 && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 uppercase whitespace-nowrap">
                              #{nearbyRank + 1} Nearest
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-xs">
                          <p className="flex justify-between"><b className="text-slate-500">City:</b><span className="font-bold">{h.city}</span></p>
                          <p className="flex justify-between text-emerald-700"><b>Total Beds:</b><span>{h.totalBeds}</span></p>
                          <p className="flex justify-between text-rose-600"><b>ICU:</b><span>{h.icuBeds}</span></p>
                          <p className="flex justify-between text-blue-600"><b>Ventilators:</b><span>{h.ventilators}</span></p>
                          <p className="flex justify-between text-purple-600"><b>Ambulances:</b><span>{h.ambulances}</span></p>
                          {dist !== null && (
                            <div className="border-t pt-1.5 mt-1.5 flex justify-between font-bold text-primary-600">
                              <span>Distance:</span><span>{dist.toFixed(1)} km (~{Math.max(5, Math.round(dist * 2.2))} min)</span>
                            </div>
                          )}
                          <p className="text-slate-400 text-[10px] mt-1 leading-snug">{h.specialties}</p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  {isTop3 && (
                    <Circle center={[h.latitude, h.longitude]} radius={3000}
                      pathOptions={{ color: '#f59e0b', weight: 1.5, fillColor: '#f59e0b', fillOpacity: 0.10 }} />
                  )}
                </React.Fragment>
              );
            })}

            {/* Emergencies */}
            {emergencies.map(e => (
              <Marker key={`e-${e.id}`} position={[e.latitude, e.longitude]} icon={EmergencyIcon}>
                <Popup maxWidth={220}>
                  <div className="p-2">
                    <h4 className="font-extrabold text-red-600 text-sm mb-1">🚨 Emergency #{e.id}</h4>
                    <p className="text-xs"><b>Patient:</b> {e.patientName}</p>
                    <p className="text-xs"><b>Type:</b> {e.emergencyType}</p>
                    <p className="text-xs"><b>Status:</b> {e.status}</p>
                    {e.allocatedHospital && <p className="text-xs text-emerald-600"><b>→</b> {e.allocatedHospital}</p>}
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase ${e.severity === 'CRITICAL' ? 'bg-red-500 text-white' : e.severity === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {e.severity}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Overlay counters */}
          <div className="absolute top-3 left-3 z-[999] flex gap-2 pointer-events-none">
            <Badge color="bg-emerald-500" label={`${hospitals.length} Hospitals`} />
            <Badge color="bg-red-500" label={`${emergencies.length} Incidents`} />
          </div>

          {!userPos && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[999]">
              <button onClick={locateUser}
                className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-2xl shadow-primary-500/40 transition-human">
                <LocateFixed size={16} /> Click to find hospitals near you
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">

          {/* Header */}
          <div className="glass-card rounded-2xl border-surface-border bg-surface-bg/60 p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Navigation size={14} className="text-primary-500" />
                <span className="font-black text-surface-text text-sm">All Hospitals</span>
              </div>
              {userPos && (
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  ↑ Nearest First
                </span>
              )}
            </div>
            {userPos ? (
              <p className="text-[10px] text-surface-muted font-bold">
                {nearbyHospitals.length} hospitals sorted · closest {nearbyHospitals[0]?.distance?.toFixed(1)} km
              </p>
            ) : (
              <p className="text-[10px] text-surface-muted font-bold">Enable location to sort by distance</p>
            )}
          </div>

          {/* No location prompt */}
          {!userPos && (
            <div className="glass-card rounded-2xl border-surface-border p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                <LocateFixed size={22} className="text-primary-500" />
              </div>
              <p className="font-black text-surface-text text-sm">Enable Location</p>
              <p className="text-[10px] text-surface-muted font-bold">See all 55 hospitals ranked nearest → farthest in real-time.</p>
              <button onClick={locateUser} className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-human">
                Allow Location
              </button>
            </div>
          )}

          {/* Grouped hospital list: nearest → farthest */}
          {userPos && <HospitalList hospitals={nearbyHospitals} selectedId={selectedId} onSelect={flyTo} />}
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-input rounded-xl border border-surface-border text-[9px] font-black uppercase tracking-wider text-surface-muted">
    <div style={{ background: color }} className="w-2 h-2 rounded-full flex-shrink-0" />
    {label}
  </div>
);

const Badge = ({ color, label }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 ${color} rounded-xl text-[9px] font-black text-white uppercase tracking-wider`}>
    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{label}
  </div>
);

const Stat = ({ label, value, color }) => (
  <div className="text-center">
    <p className="text-[8px] text-surface-muted font-bold uppercase">{label}</p>
    <p className={`text-xs font-black ${color}`}>{value}</p>
  </div>
);

// ─── Distance band helpers ───────────────────────────────────────────────────
function getBand(km) {
  if (km <= 50)  return { label: 'Very Near',  dot: 'bg-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5',  txt: 'text-emerald-400', bar: '#10b981' };
  if (km <= 200) return { label: 'Nearby',     dot: 'bg-amber-400',   border: 'border-amber-500/30',  bg: 'bg-amber-500/5',   txt: 'text-amber-400',   bar: '#f59e0b' };
  if (km <= 500) return { label: 'Regional',   dot: 'bg-orange-400',  border: 'border-orange-500/30', bg: 'bg-orange-500/5',  txt: 'text-orange-400',  bar: '#f97316' };
  return          { label: 'Farther',          dot: 'bg-red-400',     border: 'border-red-500/20',    bg: 'bg-red-500/3',     txt: 'text-red-400',     bar: '#ef4444' };
}

// Visual distance bar: width proportional to km (max capped at 3000 for scaling)
const DistanceBar = ({ km, color }) => {
  const pct = Math.min(100, (km / 3000) * 100);
  return (
    <div className="w-full h-1 rounded-full bg-surface-border/50 overflow-hidden mt-1">
      <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-500" />
    </div>
  );
};

const HospitalList = ({ hospitals, selectedId, onSelect }) => {
  // Group by band, preserving nearest-first order
  let lastBand = null;
  const maxDist = hospitals[hospitals.length - 1]?.distance || 1;

  return (
    <div className="flex flex-col gap-2">
      {hospitals.map((h, i) => {
        const band = getBand(h.distance);
        const showBandHeader = band.label !== lastBand;
        if (showBandHeader) lastBand = band.label;
        const barPct = Math.min(100, (h.distance / Math.max(maxDist, 1)) * 100);

        return (
          <React.Fragment key={h.id}>
            {/* Band header divider */}
            {showBandHeader && (
              <div className="flex items-center gap-2 pt-1 px-1">
                <div className={`w-2 h-2 rounded-full ${band.dot} flex-shrink-0`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-surface-muted">
                  {band.label}
                </span>
                <div className="flex-1 h-[1px] bg-surface-border/40" />
              </div>
            )}

            {/* Hospital card */}
            <button
              onClick={() => onSelect(h)}
              className={`rounded-2xl border p-3.5 text-left w-full transition-all duration-150 hover:scale-[1.015] active:scale-[0.99] ${
                selectedId === h.id
                  ? 'border-primary-500/50 bg-primary-500/8 shadow-lg shadow-primary-500/10'
                  : `${band.border} ${band.bg}`
              }`}
            >
              {/* Row 1: rank + name + distance */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 ${
                  i === 0 ? 'bg-emerald-500' : i < 5 ? 'bg-amber-500' : i < 15 ? 'bg-orange-500' : 'bg-slate-500'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-surface-text text-[11px] leading-tight truncate">{h.name}</p>
                  <p className="text-[9px] text-surface-muted font-bold">{h.city}</p>
                </div>
                <span className={`text-sm font-black flex-shrink-0 ${band.txt}`}>
                  {h.distance.toFixed(1)}<span className="text-[9px] font-bold"> km</span>
                </span>
              </div>

              {/* Distance progress bar */}
              <div className="w-full h-1.5 rounded-full bg-surface-border/30 overflow-hidden mb-2">
                <div
                  style={{ width: `${barPct}%`, background: band.bar }}
                  className="h-full rounded-full transition-all duration-700"
                />
              </div>

              {/* Row 2: stats */}
              <div className="grid grid-cols-4 gap-0 divide-x divide-surface-border/30">
                <div className="text-center pr-1">
                  <p className="text-[8px] text-surface-muted font-bold">ETA</p>
                  <p className={`text-[10px] font-black ${band.txt}`}>~{Math.max(5, Math.round(h.distance * 2.2))}m</p>
                </div>
                <div className="text-center px-1">
                  <p className="text-[8px] text-surface-muted font-bold">Beds</p>
                  <p className="text-[10px] font-black text-emerald-400">{h.totalBeds}</p>
                </div>
                <div className="text-center px-1">
                  <p className="text-[8px] text-surface-muted font-bold">ICU</p>
                  <p className="text-[10px] font-black text-rose-400">{h.icuBeds}</p>
                </div>
                <div className="text-center pl-1">
                  <p className="text-[8px] text-surface-muted font-bold">🚑</p>
                  <p className="text-[10px] font-black text-blue-400">{h.ambulances}</p>
                </div>
              </div>

              {/* Specialties only for top 5 */}
              {i < 5 && (
                <p className="text-[9px] text-surface-muted mt-1.5 pt-1.5 border-t border-surface-border/30 truncate">
                  {h.specialties}
                </p>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default LiveMap;
