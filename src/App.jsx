import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './components/Dashboard';
import VehicleRegistry from './components/VehicleRegistry';
import TripDispatcher from './components/TripDispatcher';
import FuelExpenses from './components/FuelExpenses';
import DriverConsole from './components/DriverConsole';
import Settings from './components/Settings';

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState('Fleet Manager');
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        const forcedRole = determineAndSetRole(session.user.email);
        syncUserRoleMetadata(session, forcedRole);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        const forcedRole = determineAndSetRole(session.user.email);
        syncUserRoleMetadata(session, forcedRole);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserRoleMetadata = async (currentSession, role) => {
    if (currentSession && currentSession.user.email !== 'demo@transitops.io') {
      try {
        const currentMetaRole = currentSession.user.user_metadata?.role;
        if (currentMetaRole !== role) {
          await supabase.auth.updateUser({
            data: {
              role: role,
              user_role: role,
              role_name: role
            }
          });
        }
      } catch (err) {
        console.error("Failed to sync role metadata:", err);
      }
    }
  };

  // Strict Matrix Mapping based on the authenticated email address prefix
  const determineAndSetRole = (userEmail) => {
    let forcedRole = 'Fleet Manager'; // Default fallback
    const lowerEmail = userEmail.toLowerCase();

    if (lowerEmail.startsWith('dispatch')) {
      forcedRole = 'Dispatcher';
    } else if (lowerEmail.startsWith('safety')) {
      forcedRole = 'Safety Officer';
    } else if (lowerEmail.startsWith('finance')) {
      forcedRole = 'Financial Analyst';
    } else if (lowerEmail.startsWith('driver')) {
      forcedRole = 'Driver';
    } else if (lowerEmail.startsWith('manager')) {
      forcedRole = 'Fleet Manager';
    }

    setUserRole(forcedRole);
    setCurrentScreen(forcedRole === 'Driver' ? 'driver' : 'dashboard');
    return forcedRole;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    // 1. Authenticate credentials against Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setAuthError(error.message);
    } else if (data?.session?.user?.email) {
      // 2. Drive the application state strictly by user identity email
      const forcedRole = determineAndSetRole(data.session.user.email);
      try {
        await supabase.auth.updateUser({
          data: {
            role: forcedRole,
            user_role: forcedRole,
            role_name: forcedRole
          }
        });
      } catch (err) {
        console.error("Failed to sync metadata during login:", err);
      }
    }
    setLoading(false);
  };

  const handleDemoMode = () => {
    const fakeSession = {
      user: {
        email: 'demo@transitops.io'
      }
    };
    setSession(fakeSession);
    setUserRole('Fleet Manager');
    setCurrentScreen('dashboard');
  };

  const handleSignOut = async () => {
    if (session?.user?.email === 'demo@transitops.io') {
      setSession(null);
    } else {
      await supabase.auth.signOut();
    }
    setCurrentScreen('dashboard');
    setEmail('');
    setPassword('');
  };

  // SYSTEM AUTHENTICATION GATEWAY
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050814] px-4 perspective-1000 relative overflow-hidden">
        {/* Scrolling 3D perspective wireframe grid background */}
        <div className="bg-3d-perspective"></div>

        <div className="w-full max-w-sm panel-3d card-3d p-8 rounded-3xl space-y-6 relative z-10">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img src="/logo.png" alt="TransitOps Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(14,165,233,0.3)] animate-pulse" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-wider text-white neon-glow-cyan">TransitOps</h1>
              <p className="text-xs text-[#0ea5e9] font-mono font-bold uppercase tracking-wider">Enterprise Control Console</p>
            </div>
          </div>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs p-3 rounded-xl font-mono text-center shadow-inner">
              ⚠️ Authentication Failed: {authError}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">Email Address</label>
              <input
                type="email"
                placeholder="manager@transitops.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050814]/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#0ea5e9] font-mono shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050814]/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#0ea5e9] shadow-inner"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-3d-indigo text-white font-bold text-xs py-3 rounded-xl transition shadow-lg mt-2 tracking-wide cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating Node...' : 'Secure System Authentication'}
            </button>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-slate-850"></div>
              <span className="mx-4 text-[10px] text-slate-500 font-mono uppercase">Or</span>
              <div className="flex-grow border-t border-slate-850"></div>
            </div>

            <button
              type="button"
              onClick={handleDemoMode}
              className="w-full btn-3d-amber text-amber-400 font-bold text-xs py-3 rounded-xl transition shadow-lg tracking-wide flex items-center justify-center gap-2 cursor-pointer"
            >
              ⚡ Enter System in Demo Mode (Local Sync)
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CORE APPLICATION INTERFACE (POST-AUTHENTICATION WORKSPACE)
  return (
    <div className="flex h-screen bg-[#050814] text-slate-100 font-sans overflow-hidden relative">
      {/* Scrolling 3D perspective wireframe grid background */}
      <div className="bg-3d-perspective"></div>

      {/* SIDEBAR NAVIGATION - CONTROLLED BY ASSIGNED RBAC ROLES */}
      <div className="w-64 bg-[#0d1527]/90 border-r border-[#0ea5e9]/15 p-5 flex flex-col justify-between shrink-0 shadow-[5px_0_20px_rgba(0,0,0,0.6)] z-10 relative">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <img src="/logo.png" alt="TransitOps Icon" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(14,165,233,0.2)]" />
            <div>
              <h1 className="text-base font-black tracking-wider text-white neon-glow-cyan leading-none">TransitOps</h1>
              <span className="text-[8px] text-[#0ea5e9] font-mono font-bold uppercase tracking-wider block mt-1">
                {session.user.email === 'demo@transitops.io' ? 'OFFLINE DEMO' : '5-WAY RBAC'}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {userRole === 'Driver' ? (
              <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#050814]/80 text-[#0ea5e9] rounded-xl text-xs font-bold border border-slate-850 cursor-default shadow-inner">
                📡 Cloud Telemetry Engaged
              </button>
            ) : (
              <>
                <button onClick={() => setCurrentScreen('dashboard')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${currentScreen === 'dashboard' ? 'bg-[#0284c7] text-white shadow-md shadow-[#0ea5e9]/20' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}>📊 Dashboard</button>
                {(userRole === 'Fleet Manager' || userRole === 'Safety Officer' || userRole === 'Financial Analyst') && (
                  <button onClick={() => setCurrentScreen('vehicles')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${currentScreen === 'vehicles' ? 'bg-[#0284c7] text-white shadow-md shadow-[#0ea5e9]/20' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}>🚚 Fleet & Drivers</button>
                )}
                {(userRole === 'Fleet Manager' || userRole === 'Dispatcher' || userRole === 'Safety Officer') && (
                  <button onClick={() => setCurrentScreen('dispatcher')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${currentScreen === 'dispatcher' ? 'bg-[#0284c7] text-white shadow-md shadow-[#0ea5e9]/20' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}>📍 Trips & Routing</button>
                )}
                {(userRole === 'Fleet Manager' || userRole === 'Financial Analyst') && (
                  <button onClick={() => setCurrentScreen('fuel')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${currentScreen === 'fuel' ? 'bg-[#0284c7] text-white shadow-md shadow-[#0ea5e9]/20' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}>⛽ Fuel & Expenses</button>
                )}
                <button onClick={() => setCurrentScreen('settings')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${currentScreen === 'settings' ? 'bg-[#0284c7] text-white shadow-md shadow-[#0ea5e9]/20' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}`}>⚙️ Settings & RBAC</button>
              </>
            )}
          </nav>
        </div>

        <div>
          <div className="text-[10px] text-slate-500 truncate mb-3.5 px-3 font-mono">
            User: {session.user.email}
          </div>
          <button onClick={handleSignOut} className="w-full text-left text-xs font-bold text-slate-400 hover:text-rose-400 px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 hover:bg-rose-500/5">
            🚪 Log Out of System
          </button>
        </div>
      </div>

      {/* DYNAMIC VIEWWORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-14 bg-[#0d1527]/40 border-b border-[#0ea5e9]/10 flex items-center justify-between px-6 backdrop-blur-md shrink-0">
          <span className="text-[10px] tracking-wider uppercase bg-[#0d1527] text-slate-350 font-mono px-2.5 py-0.5 rounded border border-[#0ea5e9]/20 shadow-sm font-bold">
            Active Context: {userRole}
          </span>
          <div className="text-[10px] text-slate-400 font-mono">
            Instance: <span className="text-[#0ea5e9] font-bold">vishal240180107059-max</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-transparent">
          {currentScreen === 'dashboard' && <Dashboard userRole={userRole} />}
          {currentScreen === 'vehicles' && <VehicleRegistry userRole={userRole} />}
          {currentScreen === 'dispatcher' && <TripDispatcher userRole={userRole} />}
          {currentScreen === 'fuel' && <FuelExpenses userRole={userRole} />}
          {currentScreen === 'driver' && <DriverConsole />}
          {currentScreen === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}