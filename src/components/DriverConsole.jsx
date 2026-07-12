import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function DriverConsole() {
  const [activeTrip, setActiveTrip] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [coords, setCoords] = useState({ lat: 21.1702, lng: 72.8311 });
  const [simulating, setSimulating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Standby');

  // 1. POLLING ASSIGNED DISPATCH RUNS FROM THE CLOUD PIPELINE
  useEffect(() => {
    const fetchAssignedTrip = async () => {
      // Pulls the latest dispatched route matching this demo node instance
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'Dispatched')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setActiveTrip(data[0]);
        setCoords({ lat: Number(data[0].lat), lng: Number(data[0].lng) });
      } else {
        setActiveTrip(null);
      }
    };

    fetchAssignedTrip();
    const interval = setInterval(fetchAssignedTrip, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. LIVE COORDINATE BROADCAST UPLINK ENGINE
  useEffect(() => {
    let watchId = null;

    if (isOnline && !simulating) {
      setStatusMsg('Broadcasting live hardware GPS positions...');
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setCoords({ lat: latitude, lng: longitude });

            if (activeTrip) {
              await supabase
                .from('trips')
                .update({ lat: latitude, lng: longitude })
                .eq('id', activeTrip.id);
            }
          },
          (err) => setStatusMsg(`GPS Error: ${err.message}`),
          { enableHighAccuracy: true }
        );
      } else {
        setStatusMsg('Hardware error: Geolocation API unsupported.');
      }
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, simulating, activeTrip]);

  // 3. HACKATHON STAGE SIMULATOR ROUTINE
  useEffect(() => {
    let simInterval = null;

    if (isOnline && simulating && activeTrip) {
      setStatusMsg('Simulating route path movement loops...');
      simInterval = setInterval(async () => {
        setCoords((prev) => {
          // Slight coordinate drift variables to simulate a driving vehicle asset
          const nextLat = +(prev.lat + (Math.random() - 0.5) * 0.0015).toFixed(6);
          const nextLng = +(prev.lng + (Math.random() - 0.5) * 0.0015).toFixed(6);

          supabase
            .from('trips')
            .update({ lat: nextLat, lng: nextLng })
            .eq('id', activeTrip.id)
            .then(() => {});

          return { lat: nextLat, lng: nextLng };
        });
      }, 3000);
    }

    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [isOnline, simulating, activeTrip]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    if (isOnline) {
      setSimulating(false);
      setStatusMsg('Standby');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-black text-white">Driver Uplink Console</h2>
          <p className="text-[10px] text-indigo-400 font-mono">Mobile Node Terminal</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* TRIP INFORMATION CARD CARD */}
      {activeTrip ? (
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Assigned Active Dispatch Run</span>
          <h3 className="text-sm font-bold text-white">{activeTrip.source} ⇄ {activeTrip.destination}</h3>
          <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono text-slate-400 border-t border-slate-900">
            <div>Asset: <b className="text-slate-200">{activeTrip.vehicle_reg}</b></div>
            <div>Cargo Load: <b className="text-slate-200">{activeTrip.cargo_weight} kg</b></div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-center text-xs text-slate-500 py-6 font-medium">
          📭 Waiting for dispatch orders from Central Command Room...
        </div>
      )}

      {/* TELEMETRY READOUT METRIC LAYER */}
      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-3">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Broadcasting Coordinate Array</span>
        <div className="grid grid-cols-2 gap-3 font-mono text-center">
          <div className="bg-slate-900 p-2.5 border border-slate-800 rounded-xl">
            <span className="block text-[9px] text-slate-500 uppercase">Latitude</span>
            <span className="text-xs font-bold text-slate-200">{coords.lat}</span>
          </div>
          <div className="bg-slate-900 p-2.5 border border-slate-800 rounded-xl">
            <span className="block text-[9px] text-slate-500 uppercase">Longitude</span>
            <span className="text-xs font-bold text-slate-200">{coords.lng}</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
          Status: {statusMsg}
        </div>
      </div>

      {/* UPLINK MASTER HARDWARE BUTTON SIGNALS */}
      <div className="space-y-2">
        <button
          onClick={toggleOnline}
          className={`w-full py-3 rounded-xl font-bold text-xs transition shadow-lg ${
            isOnline 
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10'
          }`}
        >
          {isOnline ? 'Disconnect Telemetry Uplink Stream' : 'Establish Live Telemetry Uplink'}
        </button>

        {isOnline && activeTrip && (
          <button
            onClick={() => setSimulating(!simulating)}
            className={`w-full py-2 rounded-xl font-bold text-[11px] border transition ${
              simulating 
                ? 'bg-amber-600/10 border-amber-500/30 text-amber-400' 
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            {simulating ? '⏸ Pause Driving Path Simulation' : '🚀 Activate Driving Path Simulation'}
          </button>
        )}
      </div>
    </div>
  );
}