import React, { useState } from 'react';
import { useDb } from '../DbContext';

export default function VehicleRegistry() {
  const { vehicles, drivers, insertVehicle } = useDb();

  // Tab State: 'vehicles' | 'drivers'
  const [activeTab, setActiveTab] = useState('vehicles');

  // Form states for creating new assets
  const [newRegNo, setNewRegNo] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Driver status filter state
  const [driverFilter, setDriverFilter] = useState('All');

  // Validate and add a new vehicle instance
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Unique Reg Number Check
    const exists = vehicles.some(v => v.regNo.toUpperCase() === newRegNo.toUpperCase());
    if (exists) {
      setErrorMsg(`Validation Blocked: A vehicle with Registration Number "${newRegNo.toUpperCase()}" already exists in the system registry.`);
      return;
    }

    try {
      await insertVehicle(newRegNo, newModel, newCapacity);
      setNewRegNo('');
      setNewModel('');
      setNewCapacity('');
    } catch (err) {
      let msg = err.message;
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
        msg = `${msg}. Note: Central Supabase database restricts write access for this role. To test full read/write operations, click 'Disconnect Session' at the bottom-left and enter via 'Demo Mode (Local Sync)'.`;
      }
      setErrorMsg(`Registry Failed: ${msg}`);
    }
  };

  const isLicenseExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  // Filter drivers list based on status button
  const filteredDrivers = drivers.filter(d => {
    if (driverFilter === 'All') return true;
    return d.status.toLowerCase() === driverFilter.toLowerCase();
  });

  // Calculate compliance rate
  const complianceRate = drivers.length > 0
    ? ((drivers.filter(d => !isLicenseExpired(d.expiry) && d.status !== 'Suspended').length / drivers.length) * 100).toFixed(1)
    : "100.0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-350 perspective-1000">

      {/* Dynamic Tab Navigation Header */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-3 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight font-sans">Fleet & Operations Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Manage logistical hardware assets and operator credentials.</p>
        </div>
        <div className="flex gap-1.5 bg-slate-900 border border-slate-850 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'vehicles' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🚚 Fleet Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'drivers' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🪪 Operators ({drivers.length})
          </button>
        </div>
      </div>

      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* REGISTER ASSET INPUT PANEL (3D card) */}
          <div className="lg:col-span-4 panel-3d card-3d p-5 rounded-2xl h-fit space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Register New Asset</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Create a physical unit inside the fleet registry database.</p>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl font-mono leading-relaxed shadow-inner">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Reg Code (Unique)</label>
                <input
                  type="text"
                  placeholder="e.g. VAN-05"
                  value={newRegNo}
                  onChange={(e) => setNewRegNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono shadow-inner"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Model / Type Description</label>
                <input
                  type="text"
                  placeholder="e.g. Ford Transit Van"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Max Capacity Weight (kg)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 shadow-inner"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full btn-3d-indigo text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer mt-2"
              >
                Commit Asset Registry Entry
              </button>
            </form>
          </div>

          {/* VEHICLES MASTER GRID (3D Panel) */}
          <div className="lg:col-span-8 panel-3d rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Fleet Operations Asset List</span>
              <span className="text-[10px] text-slate-500 font-mono">Count: {vehicles.length} Units</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-350">
                <thead className="bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Reg Code</th>
                    <th className="p-4">Model/Type</th>
                    <th className="p-4 text-right">Max Capacity</th>
                    <th className="p-4 text-right">Odometer</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {vehicles.map((v) => (
                    <tr key={v.regNo} className="hover:bg-slate-850/20 transition-colors">
                      <td className="p-4 font-bold text-indigo-400">{v.regNo}</td>
                      <td className="p-4 font-sans font-medium text-slate-200">
                        <div>{v.model}</div>
                        <span className="text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">{v.type}</span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-400">{v.maxCapacity.toLocaleString()} kg</td>
                      <td className="p-4 text-right text-slate-400">{v.odometer.toLocaleString()} km</td>
                      <td className="p-4 text-center font-sans">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${v.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            v.status === 'On Trip' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              v.status === 'In Shop' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="space-y-6">

          {/* BENTO STATS & FILTER HEADER (3D Panels) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Status Toggle filter row */}
            <div className="md:col-span-8 panel-3d p-5 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-3.5">
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">Filter Operator Pool</span>
                <span className="text-[10px] text-amber-450 flex items-center gap-1 font-mono">
                  ⚠️ Expired license or Suspended status prevents active trip assignment
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All', 'Available', 'On Trip', 'Suspended'].map(st => (
                  <button
                    key={st}
                    onClick={() => setDriverFilter(st)}
                    className={`flex-1 min-w-[100px] border py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${driverFilter === st
                        ? 'btn-3d-indigo text-white shadow-lg'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    {st === 'All' ? '🗂 All Operators' : st === 'Available' ? '✅ Available' : st === 'On Trip' ? '🚚 On Trip' : '🚫 Suspended'}
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance card */}
            <div className="md:col-span-4 panel-3d rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">Fleet Compliance Rate</span>
                <div className="mt-2.5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-emerald-450 tracking-tight">{complianceRate}%</span>
                  <span className="text-[10px] text-slate-500 font-mono">Active Compliance</span>
                </div>
              </div>
              <div className="mt-4 w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${complianceRate}%` }}
                ></div>
              </div>
            </div>

          </div>

          {/* MAIN DRIVERS & COMPLIANCE MATRIX TABLE (3D Panel) */}
          <div className="panel-3d rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Personnel Compliance Register</span>
              <span className="text-[10px] text-slate-500 font-mono">Showing {filteredDrivers.length} operators</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-350">
                <thead className="bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Driver</th>
                    <th className="p-4">License Credentials</th>
                    <th className="p-4">License Expiration</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4 text-center">Safety Rating</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredDrivers.map((d) => {
                    const expired = isLicenseExpired(d.expiry);
                    return (
                      <tr key={d.license} className="hover:bg-slate-850/20 transition-colors">
                        <td className="p-4 font-sans font-bold text-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold font-sans text-xs">
                              {d.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-200">{d.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>{d.license}</div>
                          <span className="text-[9px] text-slate-500 font-sans">{d.category}</span>
                        </td>
                        <td className="p-4 font-sans">
                          <div className="flex items-center gap-1.5">
                            <span className={expired ? 'text-rose-400 font-bold' : 'text-slate-300'}>{d.expiry}</span>
                            {expired && (
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">
                                Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{d.phone}</td>
                        <td className="p-4 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded ${d.safetyScore >= 90 ? 'text-emerald-400 bg-emerald-500/5' :
                              d.safetyScore >= 80 ? 'text-amber-400 bg-amber-500/5' :
                                'text-rose-400 bg-rose-500/5'
                            }`}>
                            {d.safetyScore}/100
                          </span>
                        </td>
                        <td className="p-4 text-right font-sans">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${d.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              d.status === 'On Trip' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                d.status === 'Suspended' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                  'bg-slate-700/20 text-slate-400 border-slate-700/30'
                            }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* LOWER ALERTS GRID WITH 3D BORDER ACCENTS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="panel-3d card-3d p-5 rounded-2xl shadow-2xl flex flex-col gap-2 border-l-4 border-rose-500">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] font-bold text-rose-455 uppercase">Alert: Licensing</span>
                <span className="text-rose-450 text-xs font-bold">⚠️ Action Required</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Drivers with expired or suspended credentials are automatically excluded from the route dispatch selection pool.
              </p>
            </div>

            <div className="panel-3d card-3d p-5 rounded-2xl shadow-2xl flex flex-col gap-2 border-l-4 border-emerald-500">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] font-bold text-emerald-450 uppercase">Fleet Performance</span>
                <span className="text-emerald-450 text-xs font-bold">📈 Trending</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Operator safety scores average 84/100. Standard dispatch limits remain active.
              </p>
            </div>

            <div className="panel-3d card-3d p-5 rounded-2xl shadow-2xl flex flex-col gap-2 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[9px] font-bold text-indigo-400 uppercase">Roster Load</span>
                <span className="text-indigo-400 text-xs font-bold">📍 Coverage</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Active monitoring streams coordinates for all en-route drivers. Telemetry update ticks every 5 seconds.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}