import React, { useState } from 'react';

export default function Settings() {
  // General Configurations Form States
  const [depotName, setDepotName] = useState('Gandhinagar Depot GJ14');
  const [currency, setCurrency] = useState('INR (₹)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // General Settings Save Action
  const handleSave = (e) => {
    e.preventDefault();
    // Persist permissions and configurations locally
    localStorage.setItem('rbac_matrix', JSON.stringify(rbacMatrix));
    localStorage.setItem('depot_name', depotName);
    localStorage.setItem('depot_currency', currency);
    localStorage.setItem('depot_distance', distanceUnit);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Permission State Initial Load from storage or default matrix
  const [rbacMatrix, setRbacMatrix] = useState(() => {
    const saved = localStorage.getItem('rbac_matrix');
    return saved ? JSON.parse(saved) : [
      { role: 'Fleet Manager', fleet: '✓', driver: '✓', trip: '—', fuel: '—', analytics: '✓' },
      { role: 'Dispatcher', fleet: 'View', driver: '—', trip: '✓', fuel: '—', analytics: '—' },
      { role: 'Safety Officer', fleet: '—', driver: '✓', trip: 'View', fuel: '—', analytics: '—' },
      { role: 'Financial Analyst', fleet: 'View', driver: '—', trip: '—', fuel: '✓', analytics: '✓' },
    ];
  });

  const handleCyclePermission = (roleIndex, field) => {
    const currentValue = rbacMatrix[roleIndex][field];
    let nextValue = '—';
    if (currentValue === '—') nextValue = '✓';
    else if (currentValue === '✓') nextValue = 'View';
    else if (currentValue === 'View') nextValue = '—';

    const next = [...rbacMatrix];
    next[roleIndex] = {
      ...next[roleIndex],
      [field]: nextValue
    };
    setRbacMatrix(next);
  };

  const renderPermissionButton = (roleIndex, field, value) => {
    let content = '—';
    let colorClass = 'text-slate-600 hover:text-slate-400';
    let titleText = 'No Access';

    if (value === '✓') {
      content = '✓'; // Right Check
      colorClass = 'text-emerald-450 hover:text-emerald-300';
      titleText = 'Full Write Access';
    } else if (value === 'View') {
      content = '👁'; // View Eye
      colorClass = 'text-cyan-400 hover:text-cyan-300';
      titleText = 'Read Only Access';
    } else if (value === '—') {
      content = '✗'; // Wrong Cross
      colorClass = 'text-rose-500 hover:text-rose-455';
      titleText = 'No Access';
    }

    return (
      <button
        type="button"
        title={titleText}
        onClick={() => handleCyclePermission(roleIndex, field)}
        className={`w-10 h-10 rounded-xl hover:bg-slate-950/60 active:scale-95 transition-all flex items-center justify-center border border-transparent hover:border-slate-850/50 cursor-pointer text-sm font-sans font-black ${colorClass}`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-350 perspective-1000">
      
      {/* Header Block */}
      <div>
        <h3 className="text-xl font-extrabold text-white tracking-tight">Settings & RBAC Panel</h3>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Manage regional deployment parameters and security permission mapping tables.</p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl font-mono max-w-md shadow-inner">
          ✓ Configuration matrix properties successfully saved.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: GENERAL SETTINGS FORM PANEL (3D Card) */}
        <form onSubmit={handleSave} className="lg:col-span-5 panel-3d card-3d p-6 rounded-2xl space-y-4 shadow-2xl">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">General Configuration</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono tracking-wider">Depot Name</label>
              <input 
                type="text" 
                value={depotName} 
                onChange={(e) => setDepotName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#0ea5e9] shadow-inner" 
                required 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono tracking-wider">Currency Configuration</label>
              <input 
                type="text" 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#0ea5e9] font-mono shadow-inner" 
                required 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase font-mono tracking-wider">Distance Metric Unit</label>
              <input 
                type="text" 
                value={distanceUnit} 
                onChange={(e) => setDistanceUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#0ea5e9] shadow-inner" 
                required 
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="btn-3d-indigo text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: ROLE-BASED ACCESS MATRIX GRID TABLE (3D Panel) */}
        <div className="lg:col-span-7 panel-3d rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">Role-Based Access (RBAC) Control Matrix</span>
            <span className="text-[10px] text-slate-400 font-mono font-semibold">Click cells to cycle permissions</span>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-350">
              <thead className="bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4 font-mono">Role</th>
                  <th className="p-4 font-mono text-center">Fleet</th>
                  <th className="p-4 font-mono text-center">Driver</th>
                  <th className="p-4 font-mono text-center">Trip</th>
                  <th className="p-4 font-mono text-center">Fuel/Exp</th>
                  <th className="p-4 font-mono text-center">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium font-mono text-[11px]">
                {rbacMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/10 transition-colors">
                    <td className="p-4 text-white font-bold font-sans">{row.role}</td>
                    
                    {/* Fleet Permissions Button */}
                    <td className="p-3 flex justify-center">
                      {renderPermissionButton(idx, 'fleet', row.fleet)}
                    </td>
                    
                    {/* Driver Permissions Button */}
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        {renderPermissionButton(idx, 'driver', row.driver)}
                      </div>
                    </td>
                    
                    {/* Trip Permissions Button */}
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        {renderPermissionButton(idx, 'trip', row.trip)}
                      </div>
                    </td>
                    
                    {/* Fuel Permissions Button */}
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        {renderPermissionButton(idx, 'fuel', row.fuel)}
                      </div>
                    </td>
                    
                    {/* Analytics Permissions Button */}
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        {renderPermissionButton(idx, 'analytics', row.analytics)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}