import React, { useState, useEffect } from 'react';
import { useDb } from '../DbContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamic map panning controller to center en-route operators
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const createTruckIcon = () => {
  return L.divIcon({
    html: `<div class="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border-2 border-slate-800 shadow-2xl">
      <span class="absolute inset-0 rounded-xl bg-indigo-500 opacity-25 animate-ping"></span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-indigo-400 z-10"><path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375v7.5c0 1.036.84 1.875 1.875 1.875h.375a3.75 3.75 0 0 0 7.5 0h3.375a3.75 3.75 0 0 0 7.5 0h1.125a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75H21.5V9.75c0-1.242-1.008-2.25-2.25-2.25h-2.625V4.875A.375.375 0 0 0 16.25 4.5H3.375Zm1.125 11.25a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Zm12 0a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z"/></svg>
    </div>`,
    className: 'custom-leaflet-truck-icon',
    iconSize: [40, 40]
  });
};

export default function TripDispatcher() {
  const { vehicles, drivers, trips, dispatchTrip, completeTrip } = useDb();

  // Form Binding States
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [distance, setDistance] = useState('');
  const [error, setError] = useState('');

  const activeTrips = trips.filter(t => t.status === 'Dispatched');

  // Compute map center: follow active operator if one exists, otherwise center on base depot
  const mapCenter = activeTrips.length > 0 
    ? [Number(activeTrips[0].lat), Number(activeTrips[0].lng)] 
    : [21.1702, 72.8311];

  const handleDispatch = async (e) => {
    e.preventDefault();
    setError('');

    const targetVehicle = vehicles.find(v => v.regNo === selectedVehicle);
    const targetDriver = drivers.find(d => d.license === selectedDriver);

    if (!targetVehicle || !targetDriver) {
      setError("Please select a valid vehicle and driver.");
      return;
    }

    // Business Rule Check: Cargo Weight must not exceed vehicle capacity
    if (Number(cargoWeight) > Number(targetVehicle.maxCapacity)) {
      setError(`Overload Blocked: Payload exceeds maximum asset threshold limit (${targetVehicle.maxCapacity} kg)`);
      return;
    }

    // Business Rule Check: Expired Driver license verification
    if (new Date(targetDriver.expiry) < new Date()) {
      setError(`Compliance Blocked: Selected Operator driving credentials have expired`);
      return;
    }

    try {
      await dispatchTrip(source, destination, selectedVehicle, targetDriver.name, cargoWeight, distance);
      // Reset Form Input Buffers
      setSource('');
      setDestination('');
      setSelectedVehicle('');
      setSelectedDriver('');
      setCargoWeight('');
      setDistance('');
    } catch (err) {
      let msg = err.message;
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
        msg = `${msg}. Note: Write access is restricted by database RLS. Use 'Demo Mode' for local sync testing.`;
      }
      setError(`Dispatch Failed: ${msg}`);
    }
  };

  const handleComplete = async (tripId, vehicleReg, driverLicenseOrName) => {
    try {
      await completeTrip(tripId, vehicleReg, driverLicenseOrName);
    } catch (err) {
      let msg = err.message;
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
        msg = `${msg}. Note: Write access is restricted by database RLS. Use 'Demo Mode' for local sync testing.`;
      }
      setError(`Trip Completion Failed: ${msg}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-350 perspective-1000">
      
      {/* HEADER */}
      <div>
        <h3 className="text-xl font-extrabold text-white tracking-tight">Trips & Routing Control</h3>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Dispatch active routes and monitor live vehicle positions on the telemetry map.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DISPATCH CONTROL FORM (3D Card) */}
        <div className="lg:col-span-4 panel-3d card-3d p-5 rounded-2xl h-fit space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white">Cloud Dispatch Manifest</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Enforces real-time relational compliance checks.</p>
          </div>

          {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl font-mono leading-relaxed shadow-inner">{error}</div>}

          <form onSubmit={handleDispatch} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="Source Terminal" 
                value={source} 
                onChange={(e) => setSource(e.target.value)} 
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner" 
                required 
              />
              <input 
                type="text" 
                placeholder="Destination" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)} 
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner" 
                required 
              />
            </div>

            {/* Available Vehicles Dropdown */}
            <select 
              value={selectedVehicle} 
              onChange={(e) => setSelectedVehicle(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 shadow-inner" 
              required
            >
              <option value="">-- Choose Available Vehicle --</option>
              {vehicles.filter(v => v.status === 'Available').map(v => (
                <option key={v.regNo} value={v.regNo}>{v.regNo} ({v.model})</option>
              ))}
            </select>

            {/* Available Drivers Dropdown */}
            <select 
              value={selectedDriver} 
              onChange={(e) => setSelectedDriver(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 shadow-inner" 
              required
            >
              <option value="">-- Choose Available Driver --</option>
              {drivers.filter(d => d.status === 'Available').map(d => (
                <option key={d.license} value={d.license}>{d.name} (Score: {d.safetyScore})</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input 
                type="number" 
                placeholder="Cargo Mass (kg)" 
                value={cargoWeight} 
                onChange={(e) => setCargoWeight(e.target.value)} 
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none shadow-inner" 
                required 
              />
              <input 
                type="number" 
                placeholder="Distance (km)" 
                value={distance} 
                onChange={(e) => setDistance(e.target.value)} 
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none shadow-inner" 
                required 
              />
            </div>

            <button 
              type="submit" 
              className="w-full btn-3d-indigo text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              Authorize Route Launch
            </button>
          </form>
        </div>

        {/* ACTIVE DISPATCH ROUTES DISPLAY (3D Panel) */}
        <div className="lg:col-span-8 panel-3d rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 text-xs font-bold uppercase text-slate-400 font-mono">
            Live Active Route Monitors ({activeTrips.length})
          </div>
          <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1 max-h-[300px] custom-scrollbar">
            {activeTrips.length === 0 ? (
              <div className="text-center p-8 text-xs text-slate-500 font-sans font-medium">
                📭 No active dispatch routes currently en route.
              </div>
            ) : (
              activeTrips.map(t => (
                <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-850/10 text-xs transition-colors">
                  <div>
                    <span className="font-mono text-indigo-400 font-bold">{t.id}</span>
                    <p className="text-white font-bold mt-0.5">{t.route}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Vehicle: {t.vehicle} | Payload: {t.weight} kg | Distance: {t.distance} km</p>
                  </div>
                  <button 
                    onClick={() => handleComplete(t.id, t.vehicle, t.driver)} 
                    className="btn-3d-emerald text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Complete Route
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RENDER TELEMETRY MAP GRID (3D Panel) */}
      <div className="panel-3d rounded-2xl p-4 shadow-2xl">
        <div className="h-[360px] w-full rounded-xl overflow-hidden relative z-0 border border-slate-800">
          <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={mapCenter} />
            {activeTrips.map(t => (
              <Marker key={t.id} position={[Number(t.lat), Number(t.lng)]} icon={createTruckIcon()}>
                <Popup>
                  <div className="text-xs font-mono">
                    <b className="text-slate-900 block">{t.id}</b>
                    <span className="text-slate-600 block">{t.route}</span>
                    <span className="text-indigo-600 font-bold block">Coords: {t.lat}, {t.lng}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}