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
    html: `<div class="relative w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 border-2 border-slate-800 shadow-2xl">
      <span class="absolute inset-0 rounded-xl bg-indigo-500 opacity-25 animate-ping"></span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-indigo-400 z-10"><path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375v7.5c0 1.036.84 1.875 1.875 1.875h.375a3.75 3.75 0 0 0 7.5 0h3.375a3.75 3.75 0 0 0 7.5 0h1.125a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75H21.5V9.75c0-1.242-1.008-2.25-2.25-2.25h-2.625V4.875A.375.375 0 0 0 16.25 4.5H3.375Zm1.125 11.25a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Zm12 0a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z"/></svg>
    </div>`,
    className: 'custom-leaflet-truck-icon-dash',
    iconSize: [32, 32]
  });
};

export default function Dashboard({ userRole }) {
  const { vehicles, drivers, trips, maintLogs, fuelLogs } = useDb();

  // Filter criteria states
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  // Filter vehicles based on type
  const filteredVehiclesForKPI = vehicles.filter(v => {
    if (vehicleTypeFilter === 'All') return true;
    return v.type.toLowerCase().includes(vehicleTypeFilter.toLowerCase());
  });

  // Calculate Metrics dynamically
  const totalVehiclesCount = filteredVehiclesForKPI.length;
  const activeVehicles = filteredVehiclesForKPI.filter(v => v.status === 'On Trip').length;
  const availableVehicles = filteredVehiclesForKPI.filter(v => v.status === 'Available').length;
  const inShopVehicles = filteredVehiclesForKPI.filter(v => v.status === 'In Shop').length;
  const retiredVehicles = filteredVehiclesForKPI.filter(v => v.status === 'Retired').length;

  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const completedTripsCount = trips.filter(t => t.status === 'Completed').length;
  const pendingTripsCount = trips.filter(t => t.status === 'Pending' || t.status === 'Draft').length;

  const driversOnDuty = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;

  // Utilization rate: (Active Vehicles / Total Active Pool) * 100
  const activePool = totalVehiclesCount - retiredVehicles;
  const utilizationRate = activePool > 0 ? Math.round((activeVehicles / activePool) * 100) : 0;

  // Financial calculations
  const totalRevenue = filteredVehiclesForKPI.reduce((sum, v) => sum + (v.revenue || 0), 0);
  const totalFuelCost = filteredVehiclesForKPI.reduce((sum, v) => sum + (v.fuelCost || 0), 0);
  const totalMaintCost = filteredVehiclesForKPI.reduce((sum, v) => sum + (v.maintCost || 0), 0);
  const totalAcquisitionCost = filteredVehiclesForKPI.reduce((sum, v) => sum + (v.acquisitionCost || 35000), 0);

  const totalExpenses = totalFuelCost + totalMaintCost;
  const netProfit = totalRevenue - totalExpenses;
  const yieldROI = totalAcquisitionCost > 0 ? ((netProfit / totalAcquisitionCost) * 100).toFixed(1) : "0.0";

  // Compute map center: follow active operator if one exists, otherwise center on base depot
  const activeTrips = trips.filter(t => t.status === 'Dispatched');
  const mapCenter = activeTrips.length > 0 
    ? [Number(activeTrips[0].lat), Number(activeTrips[0].lng)] 
    : [21.1702, 72.8311];

  // Build dynamic alerts list
  const alertsList = [];
  maintLogs.filter(m => m.status === 'Open').slice(0, 2).forEach(m => {
    alertsList.push({
      type: 'error',
      title: `Shop Order: ${m.vehicle}`,
      desc: m.description,
      time: 'Active'
    });
  });
  trips.filter(t => t.status === 'Completed').slice(0, 2).forEach(t => {
    alertsList.push({
      type: 'success',
      title: `Trip Completed: ${t.id}`,
      desc: `${t.route}`,
      time: 'Info'
    });
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-350 perspective-1000">
      
      {/* PAGE HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Operational Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time telemetry evaluation and fleet status overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">Vehicle Type</span>
            <select 
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 shadow-inner"
            >
              <option value="All">All Types</option>
              <option value="Truck">Cargo Truck</option>
              <option value="Van">Delivery Van</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">Region Corridor</span>
            <select 
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 shadow-inner"
            >
              <option value="All">All Regions</option>
              <option value="North">North Zone Loop</option>
              <option value="South">South Zone Industrial</option>
            </select>
          </div>
        </div>
      </div>

      {/* 7-COLUMN METRICS GRID WITH 3D PERSPECTIVE CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Active Fleet', value: activeVehicles, color: 'text-indigo-400' },
          { label: 'Available Pool', value: availableVehicles, color: 'text-emerald-400' },
          { label: 'In Shop Care', value: inShopVehicles, color: 'text-amber-400' },
          { label: 'Active Trips', value: activeTripsCount, color: 'text-sky-400' },
          { label: 'Pending Dispatch', value: pendingTripsCount, color: 'text-purple-400' },
          { label: 'On-Duty Drivers', value: driversOnDuty, color: 'text-teal-400' },
        ].map((m, idx) => (
          <div key={idx} className="panel-3d card-3d p-4 rounded-2xl flex flex-col justify-between select-none">
            <span className="font-mono text-[9px] font-bold tracking-wider text-slate-400 uppercase">{m.label}</span>
            <p className={`text-2xl font-black font-mono mt-2 ${m.color}`}>{m.value}</p>
          </div>
        ))}

        {/* Utilization Gauge */}
        <div className="panel-3d card-3d p-4 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="font-mono text-[9px] font-bold tracking-wider text-slate-400 uppercase">Utilization</span>
            <p className="text-2xl font-black font-mono text-white mt-1">{utilizationRate}%</p>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-850">
            <div className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full rounded-full" style={{ width: `${utilizationRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT GRID (Recent Trips & Vehicle Breakdown) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Recent Trips Table (3D Panel) */}
        <div className="col-span-12 lg:col-span-8 panel-3d rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Recent Operations Manifest</h3>
            <span className="text-[10px] text-slate-500 font-mono">Total Runs: {trips.length}</span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-350">
              <thead className="bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Trip ID</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {trips.slice(0, 4).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/20 transition-colors">
                    <td className="p-4 font-bold text-indigo-400">{t.id}</td>
                    <td className="p-4 text-slate-200 font-sans font-medium">{t.route}</td>
                    <td className="p-4 text-slate-300">{t.vehicle}</td>
                    <td className="p-4 text-slate-400 font-sans">{t.driver}</td>
                    <td className="p-4 text-center font-sans">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                        t.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        t.status === 'Dispatched' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        'bg-slate-700/20 text-slate-400 border-slate-700/30'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-xs text-slate-500 font-sans font-medium">
                      📭 No operational trips logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Breakdown Chart (3D Panel) */}
        <div className="col-span-12 lg:col-span-4 panel-3d rounded-2xl p-5 flex flex-col justify-between shadow-2xl">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Vehicle Status Health</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Real-time physical asset distribution</p>
          </div>
          <div className="space-y-3.5 mt-4">
            {[
              { label: 'Available Pool', count: availableVehicles, pct: totalVehiclesCount > 0 ? (availableVehicles / totalVehiclesCount) * 100 : 0, color: 'bg-emerald-450' },
              { label: 'On Route', count: activeVehicles, pct: totalVehiclesCount > 0 ? (activeVehicles / totalVehiclesCount) * 100 : 0, color: 'bg-indigo-500' },
              { label: 'In Shop Repair', count: inShopVehicles, pct: totalVehiclesCount > 0 ? (inShopVehicles / totalVehiclesCount) * 100 : 0, color: 'bg-amber-450' },
              { label: 'Retired', count: retiredVehicles, pct: totalVehiclesCount > 0 ? (retiredVehicles / totalVehiclesCount) * 100 : 0, color: 'bg-rose-500' },
            ].map((st, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-sans">{st.label}</span>
                  <span className="font-bold font-mono text-white">{st.count}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div className={`h-full ${st.color} rounded-full`} style={{ width: `${st.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-3 bg-slate-950 border border-slate-850/50 rounded-xl text-[11px] text-slate-400 leading-relaxed italic">
            "Target fleet configuration balance: maintain In-Shop assets below 10% operational margin."
          </div>
        </div>

      </div>

      {/* CONDITIONAL FINANCIAL ROI PANEL (3D Styles) */}
      {(userRole === 'Fleet Manager' || userRole === 'Financial Analyst') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          <div className="lg:col-span-8 panel-3d rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Financial Analyst Workspace</span>
              <h4 className="text-lg font-bold text-white tracking-tight mt-1.5">Asset Return on Investment Tracking Matrix</h4>
            </div>

            <div className="grid grid-cols-3 gap-4 border-b border-slate-800/60 pb-5">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Gross Fleet Revenue</span>
                <p className="text-base font-bold text-white font-mono">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Aggregated Expenses</span>
                <p className="text-base font-bold text-rose-400 font-mono">-${totalExpenses.toLocaleString()}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Net Operational Earnings</span>
                <p className="text-base font-bold text-emerald-400 font-mono">${netProfit.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-950 border border-slate-850 p-4 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-200">Calculated Yield ROI Rate</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">[Revenue - (Maint + Fuel)] / Acquisition Cost</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-indigo-400">+{yieldROI}%</span>
                <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wide mt-0.5">Positive Margin Return</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 panel-3d card-3d rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">Telemetry Data Export</span>
              <h4 className="text-sm font-bold text-white">Operations Manifest Ledger</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Download current trip datasets, maintenance repair costs, and operator logs as local manifest copies.</p>
            </div>
            <div className="space-y-2 mt-4">
              <button 
                onClick={() => {
                  const headers = ["RegNo", "Model", "Type", "Capacity", "Odometer", "Status", "Revenue", "FuelCost", "MaintCost"];
                  const rows = vehicles.map(v => [v.regNo, v.model, v.type, v.maxCapacity, v.odometer, v.status, v.revenue, v.fuelCost, v.maintCost]);
                  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                  
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('href', url);
                  a.setAttribute('download', `TransitOps_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
                  a.click();
                }}
                className="w-full btn-3d-indigo text-xs font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                📥 Export Operational Ledger (CSV)
              </button>
            </div>
          </div>

        </div>
      )}

      {/* LOWER SECTION: LIVE ROUTE MAP & RECENT ALERTS (3D Panels) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Live Route Telemetry Map */}
        <div className="col-span-12 lg:col-span-8 panel-3d rounded-2xl h-64 overflow-hidden relative shadow-xl z-0">
          <MapContainer center={mapCenter} zoom={11} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={mapCenter} />
            {trips.filter(t => t.status === 'Dispatched').map(t => (
              <Marker key={t.id} position={[Number(t.lat), Number(t.lng)]} icon={createTruckIcon()}>
                <Popup>
                  <div className="text-xs font-mono">
                    <b className="text-slate-900 block">{t.id}</b>
                    <span className="text-slate-600 block">{t.route}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-slate-850 px-3 py-1.5 rounded-xl pointer-events-none z-[1000] shadow-2xl">
            <h4 className="text-xs font-bold text-white">Live Operations Roster</h4>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeTripsCount} Active Dispatched Units
            </div>
          </div>
        </div>

        {/* Dynamic Alerts Feed */}
        <div className="col-span-12 lg:col-span-4 panel-3d rounded-2xl flex flex-col shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Recent System Alerts</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[190px] custom-scrollbar p-3 space-y-2.5">
            {alertsList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-sans font-medium">
                ✅ System operating within normal thresholds. No warnings.
              </div>
            ) : (
              alertsList.map((a, idx) => (
                <div key={idx} className="flex gap-3 p-2 rounded-lg bg-slate-950/60 border border-slate-850 hover:bg-slate-900 transition-colors text-xs shadow-inner">
                  <div className={`p-1.5 rounded h-fit ${a.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {a.type === 'error' ? '⚠️' : '✅'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 leading-normal">{a.title}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{a.desc}</p>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">{a.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}