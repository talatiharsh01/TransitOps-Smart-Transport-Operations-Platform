import React, { useState } from 'react';
import { useDb } from '../DbContext';

export default function FuelExpenses() {
  const { 
    vehicles, 
    maintLogs, 
    fuelLogs, 
    openMaintenance, 
    closeMaintenance, 
    logFuelReceipt 
  } = useDb();

  // Form Entry States
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Open maintenance repair order
  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setErrorMsg('');

    try {
      await openMaintenance(selectedVehicle, maintDesc, maintCost);
      setMaintDesc('');
      setMaintCost('');
      setSelectedVehicle('');
    } catch (err) {
      let msg = err.message;
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
        msg = `${msg}. Note: Write access is restricted by database RLS. Use 'Demo Mode' for local sync testing.`;
      }
      setErrorMsg(`Failed to open repair ticket: ${msg}`);
    }
  };

  // Close maintenance repair order
  const handleCloseMaintenance = async (logId, regNo) => {
    setErrorMsg('');
    try {
      await closeMaintenance(logId, regNo);
    } catch (err) {
      let msg = err.message;
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
        msg = `${msg}. Note: Write access is restricted by database RLS. Use 'Demo Mode' for local sync testing.`;
      }
      setErrorMsg(`Failed to close repair ticket: ${msg}`);
    }
  };

  // Log new refueling entry
  const handleAddFuel = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setErrorMsg('');

    try {
      await logFuelReceipt(selectedVehicle, fuelLiters, fuelCost);
      setFuelLiters('');
      setFuelCost('');
      setSelectedVehicle('');
    } catch (err) {
      let msg = err.message;
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
        msg = `${msg}. Note: Write access is restricted by database RLS. Use 'Demo Mode' for local sync testing.`;
      }
      setErrorMsg(`Failed to log fuel entry: ${msg}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-350 perspective-1000">
      
      {/* HEADER SECTION */}
      <div>
        <h3 className="text-xl font-extrabold text-white tracking-tight">Fuel & Maintenance Expenses</h3>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Log fuel receipts and open shop orders to calculate the Total Cost of Ownership (TCO).</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] p-3 rounded-xl font-mono max-w-md shadow-inner">
          ⚠️ Error: {errorMsg}
        </div>
      )}

      {/* UPPER COST AGGREGATION BLOCK (3D Panel) */}
      <div className="panel-3d rounded-2xl p-5 shadow-2xl">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3.5 font-mono">Calculated Asset TCO Matrix (Fuel + Maintenance)</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map(v => {
            const totalCost = (v.maintCost || 0) + (v.fuelCost || 0);
            return (
              <div key={v.regNo} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex justify-between items-center shadow-inner">
                <div>
                  <span className="text-xs font-bold font-mono text-indigo-400">{v.regNo}</span>
                  <p className="text-[10px] text-slate-500 font-sans truncate">{v.model}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-white font-mono">${totalCost.toLocaleString()}</span>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">Maint: ${v.maintCost || 0} | Fuel: ${v.fuelCost || 0}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MAINTENANCE WORKFLOW PANEL (3D Panel) */}
        <div className="panel-3d rounded-2xl p-5 shadow-2xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Shop Orders & Maintenance Logs</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Opening an active repair order sets vehicle status to "In Shop" and blocks it from trip dispatches.</p>
          </div>

          <form onSubmit={handleCreateMaintenance} className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-850 shadow-inner">
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={selectedVehicle} 
                onChange={(e) => setSelectedVehicle(e.target.value)} 
                className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1.5 text-slate-350 focus:outline-none" 
                required
              >
                <option value="">-- Choose Asset --</option>
                {vehicles.filter(v => v.status !== 'In Shop').map(v => (
                  <option key={v.regNo} value={v.regNo}>{v.regNo}</option>
                ))}
              </select>
              <input 
                type="number" 
                placeholder="Repair Cost ($)" 
                value={maintCost} 
                onChange={(e) => setMaintCost(e.target.value)} 
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none" 
                required 
              />
            </div>
            <input 
              type="text" 
              placeholder="Issue Description (e.g. Brake replacement, Oil Change)" 
              value={maintDesc} 
              onChange={(e) => setMaintDesc(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none" 
              required 
            />
            <button 
              type="submit" 
              className="w-full btn-3d-amber text-white font-bold text-xs py-2 rounded-xl transition shadow-lg cursor-pointer"
            >
              Open Repair Ticket & Pull Asset
            </button>
          </form>

          <div className="space-y-2 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
            {maintLogs.map(log => (
              <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs shadow-inner">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 font-mono">{log.vehicle}</span>
                    <span className={`text-[9px] px-1.5 rounded font-bold uppercase ${log.status === 'Open' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>{log.status}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{log.description} (${log.cost})</p>
                  <span className="text-[9px] text-slate-500 font-mono">{log.date}</span>
                </div>
                {log.status === 'Open' && (
                  <button 
                    onClick={() => handleCloseMaintenance(log.id, log.vehicle)} 
                    className="btn-3d-emerald text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                  >
                    Close & Return
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FUEL EXPENSE UTILITY LOG (3D Panel) */}
        <div className="panel-3d rounded-2xl p-5 shadow-2xl space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Fuel Receipt Audit Ledger</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Log refueling receipts to compute fleet consumption levels.</p>
          </div>

          <form onSubmit={handleAddFuel} className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-850 shadow-inner">
            <div className="grid grid-cols-3 gap-2">
              <select 
                value={selectedVehicle} 
                onChange={(e) => setSelectedVehicle(e.target.value)} 
                className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-2 py-1.5 text-slate-350 focus:outline-none" 
                required
              >
                <option value="">-- Asset --</option>
                {vehicles.map(v => (
                  <option key={v.regNo} value={v.regNo}>{v.regNo}</option>
                ))}
              </select>
              <input 
                type="number" 
                placeholder="Volume (L)" 
                value={fuelLiters} 
                onChange={(e) => setFuelLiters(e.target.value)} 
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" 
                required 
              />
              <input 
                type="number" 
                placeholder="Cost ($)" 
                value={fuelCost} 
                onChange={(e) => setFuelCost(e.target.value)} 
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" 
                required 
              />
            </div>
            <button 
              type="submit" 
              className="w-full btn-3d-indigo text-white font-bold text-xs py-2 rounded-xl transition shadow-lg cursor-pointer"
            >
              Log Fuel Manifest Entry
            </button>
          </form>

          <div className="space-y-2 overflow-y-auto max-h-48 pr-1 font-mono text-[11px] custom-scrollbar">
            {fuelLogs.map(log => (
              <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-slate-300 shadow-inner">
                <div className="flex flex-col">
                  <span>{log.vehicle} loaded <b className="text-indigo-400">{log.liters}L</b></span>
                  <span className="text-[9px] text-slate-500">{log.date}</span>
                </div>
                <span className="text-emerald-400 font-bold">${log.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}