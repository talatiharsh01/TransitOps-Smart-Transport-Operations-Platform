import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const DbContext = createContext();

// Seed data for Demo/Local Mode
const INITIAL_VEHICLES = [
  { regNo: 'VAN-05', model: 'Ford Transit Van', type: 'Van', maxCapacity: 500, odometer: 12450, status: 'Available', revenue: 4500, acquisitionCost: 35000 },
  { regNo: 'TRK-10', model: 'Volvo FH16 Cargo', type: 'Heavy Cargo Truck', maxCapacity: 15000, odometer: 89400, status: 'Available', revenue: 28000, acquisitionCost: 85000 },
  { regNo: 'TRK-12', model: 'Scania R500 Flatbed', type: 'Heavy Cargo Truck', maxCapacity: 12000, odometer: 45200, status: 'In Shop', revenue: 12500, acquisitionCost: 78000 },
  { regNo: 'VAN-01', model: 'Mercedes Sprinter', type: 'Van', maxCapacity: 800, odometer: 195000, status: 'Retired', revenue: 0, acquisitionCost: 42000 }
];

const INITIAL_DRIVERS = [
  { name: 'Alex Mercer', license: 'DL-77721', category: 'Heavy Commercial', expiry: '2028-11-14', phone: '+1 555-0192', safetyScore: 92, status: 'Available' },
  { name: 'Sarah Connor', license: 'DL-88843', category: 'Heavy Commercial', expiry: '2029-04-22', phone: '+1 555-0147', safetyScore: 88, status: 'Available' },
  { name: 'James Morgan', license: 'DL-99912', category: 'Light Commercial', expiry: '2024-03-10', phone: '+1 555-0165', safetyScore: 95, status: 'Available' },
  { name: 'Marcus Wright', license: 'DL-55421', category: 'Heavy Commercial', expiry: '2030-01-15', phone: '+1 555-0183', safetyScore: 61, status: 'Suspended' }
];

const INITIAL_TRIPS = [
  { id: 'TRIP-101', route: 'Terminal Alpha ⇄ Hub Beta', vehicle: 'TRK-10', driver: 'Alex Mercer', weight: 4500, distance: 120, status: 'Dispatched', lat: 21.1702, lng: 72.8311 }
];

const INITIAL_MAINT_LOGS = [
  { id: 'MNT-401', vehicle: 'TRK-12', description: 'Brake Pad Replacement', cost: 650, date: '2026-07-10', status: 'Open' }
];

const INITIAL_FUEL_LOGS = [
  { id: 'FUEL-902', vehicle: 'TRK-10', liters: 150, cost: 320, date: '2026-07-11' }
];

export function DbProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // States
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintLogs, setMaintLogs] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);

  // Check session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setIsDemoMode(session.user.email === 'demo@transitops.io');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsDemoMode(session.user.email === 'demo@transitops.io');
      } else {
        setIsDemoMode(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch / Sync Data
  const loadData = async () => {
    setLoading(true);
    if (session && session.user.email !== 'demo@transitops.io') {
      // --- CLOUD MODE (SUPABASE) ---
      try {
        const { data: vData } = await supabase.from('vehicles').select('*');
        const { data: dData } = await supabase.from('drivers').select('*');
        const { data: tData } = await supabase.from('trips').select('*');
        const { data: mData } = await supabase.from('maintenance_logs').select('*');
        const { data: fData } = await supabase.from('fuel_expenses').select('*');

        // Maps to camelCase
        if (vData) setVehicles(vData.map(v => ({
          regNo: v.reg_no,
          model: v.model,
          type: v.type,
          maxCapacity: v.max_capacity,
          odometer: v.odometer || 0,
          status: v.status,
          revenue: v.revenue || 0,
          acquisitionCost: v.acquisition_cost || 35000
        })));
        if (dData) setDrivers(dData.map(d => ({
          name: d.name,
          license: d.license_number,
          category: d.category,
          expiry: d.expiry_date,
          phone: d.contact_number,
          safetyScore: d.safety_score,
          status: d.status
        })));
        if (tData) setTrips(tData.map(t => ({
          id: String(t.id),
          route: `${t.source} ⇄ ${t.destination}`,
          source: t.source,
          destination: t.destination,
          vehicle: t.vehicle_reg,
          driver: t.driver_license,
          weight: t.cargo_weight,
          distance: t.planned_distance,
          status: t.status,
          lat: t.lat,
          lng: t.lng
        })));
        if (mData) setMaintLogs(mData.map(m => ({
          id: String(m.id),
          vehicle: m.vehicle_reg,
          description: m.description,
          cost: m.cost,
          date: m.created_at ? m.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: m.status
        })));
        if (fData) setFuelLogs(fData.map(f => ({
          id: String(f.id),
          vehicle: f.vehicle_reg,
          liters: f.liters,
          cost: f.cost,
          date: f.created_at ? f.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        })));
      } catch (err) {
        console.error("Cloud Mode load failed, falling back to local:", err);
      }
    } else {
      // --- DEMO MODE (LOCALSTORAGE) ---
      const storedVehicles = localStorage.getItem('ops_vehicles');
      const storedDrivers = localStorage.getItem('ops_drivers');
      const storedTrips = localStorage.getItem('ops_trips');
      const storedMaint = localStorage.getItem('ops_maint');
      const storedFuel = localStorage.getItem('ops_fuel');

      if (storedVehicles) setVehicles(JSON.parse(storedVehicles));
      else {
        localStorage.setItem('ops_vehicles', JSON.stringify(INITIAL_VEHICLES));
        setVehicles(INITIAL_VEHICLES);
      }

      if (storedDrivers) setDrivers(JSON.parse(storedDrivers));
      else {
        localStorage.setItem('ops_drivers', JSON.stringify(INITIAL_DRIVERS));
        setDrivers(INITIAL_DRIVERS);
      }

      if (storedTrips) setTrips(JSON.parse(storedTrips));
      else {
        localStorage.setItem('ops_trips', JSON.stringify(INITIAL_TRIPS));
        setTrips(INITIAL_TRIPS);
      }

      if (storedMaint) setMaintLogs(JSON.parse(storedMaint));
      else {
        localStorage.setItem('ops_maint', JSON.stringify(INITIAL_MAINT_LOGS));
        setMaintLogs(INITIAL_MAINT_LOGS);
      }

      if (storedFuel) setFuelLogs(JSON.parse(storedFuel));
      else {
        localStorage.setItem('ops_fuel', JSON.stringify(INITIAL_FUEL_LOGS));
        setFuelLogs(INITIAL_FUEL_LOGS);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [session, isDemoMode]);

  // Real-time trip subscription for Cloud Mode
  useEffect(() => {
    if (session && !isDemoMode) {
      const tripChannel = supabase.channel('realtime-db-trips')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
          loadData();
        })
        .subscribe();

      return () => supabase.removeChannel(tripChannel);
    }
  }, [session, isDemoMode]);

  // Helper to persist local storage in Demo Mode
  const persistLocal = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // --- ACTIONS API ---

  // 1. Register Vehicle
  const insertVehicle = async (regNo, model, maxCapacity) => {
    const newVehicle = {
      regNo: regNo.toUpperCase(),
      model,
      type: parseInt(maxCapacity) > 5000 ? 'Heavy Cargo Truck' : 'Van',
      maxCapacity: parseInt(maxCapacity) || 0,
      odometer: 0,
      status: 'Available',
      revenue: 0,
      acquisitionCost: 35000
    };

    if (session && !isDemoMode) {
      const { error } = await supabase.from('vehicles').insert([{
        reg_no: newVehicle.regNo,
        model: newVehicle.model,
        type: newVehicle.type,
        max_capacity: newVehicle.maxCapacity,
        odometer: 0,
        status: 'Available',
        revenue: 0,
        acquisition_cost: 35000
      }]);
      if (error) throw error;
      await loadData();
    } else {
      const updated = [...vehicles, newVehicle];
      setVehicles(updated);
      persistLocal('ops_vehicles', updated);
    }
  };

  // 2. Dispatch Trip
  const dispatchTrip = async (source, dest, vehicleNo, driverName, weight, dist) => {
    const newTripLocal = {
      id: `TRIP-${Math.floor(100 + Math.random() * 900)}`,
      route: `${source} ⇄ ${dest}`,
      source,
      destination: dest,
      vehicle: vehicleNo,
      driver: driverName,
      weight: parseFloat(weight),
      distance: parseFloat(dist),
      status: 'Dispatched',
      lat: 21.1702 + (Math.random() - 0.5) * 0.02,
      lng: 72.8311 + (Math.random() - 0.5) * 0.02
    };

    if (session && !isDemoMode) {
      // Find driver license from name
      const matchedDriver = drivers.find(d => d.name === driverName);
      const driverLic = matchedDriver ? matchedDriver.license : driverName;

      const { error } = await supabase.from('trips').insert([{
        source,
        destination: dest,
        vehicle_reg: vehicleNo,
        driver_license: driverLic,
        cargo_weight: parseFloat(weight),
        planned_distance: parseFloat(dist),
        status: 'Dispatched',
        lat: 21.1702,
        lng: 72.8311
      }]);
      if (error) throw error;

      // Update statuses
      await supabase.from('vehicles').update({ status: 'On Trip' }).eq('reg_no', vehicleNo);
      await supabase.from('drivers').update({ status: 'On Trip' }).eq('license_number', driverLic);
      await loadData();
    } else {
      // Update state
      const updatedTrips = [...trips, newTripLocal];
      setTrips(updatedTrips);
      persistLocal('ops_trips', updatedTrips);

      const updatedVehicles = vehicles.map(v => v.regNo === vehicleNo ? { ...v, status: 'On Trip' } : v);
      setVehicles(updatedVehicles);
      persistLocal('ops_vehicles', updatedVehicles);

      const updatedDrivers = drivers.map(d => d.name === driverName ? { ...d, status: 'On Trip' } : d);
      setDrivers(updatedDrivers);
      persistLocal('ops_drivers', updatedDrivers);
    }
  };

  // 3. Complete Trip
  const completeTrip = async (tripId, vehicleNo, driverLicenseOrName, extraFuelCost = 0) => {
    if (session && !isDemoMode) {
      const { error } = await supabase.from('trips').update({ status: 'Completed' }).eq('id', parseInt(tripId));
      if (error) throw error;

      // Fetch vehicle current odometer & revenue to update
      const targetVehicle = vehicles.find(v => v.regNo === vehicleNo);
      const curOdo = targetVehicle ? targetVehicle.odometer : 0;
      const curRev = targetVehicle ? targetVehicle.revenue : 0;

      await supabase.from('vehicles').update({
        status: 'Available',
        odometer: curOdo + 150,
        revenue: curRev + 2500
      }).eq('reg_no', vehicleNo);

      await supabase.from('drivers').update({ status: 'Available' }).eq('license_number', driverLicenseOrName);
      await loadData();
    } else {
      const updatedTrips = trips.map(t => t.id === tripId ? { ...t, status: 'Completed' } : t);
      setTrips(updatedTrips);
      persistLocal('ops_trips', updatedTrips);

      const updatedVehicles = vehicles.map(v => v.regNo === vehicleNo ? {
        ...v,
        status: 'Available',
        odometer: v.odometer + 150,
        revenue: v.revenue + 2500
      } : v);
      setVehicles(updatedVehicles);
      persistLocal('ops_vehicles', updatedVehicles);

      // Find driver by name or license
      const updatedDrivers = drivers.map(d => (d.name === driverLicenseOrName || d.license === driverLicenseOrName) ? { ...d, status: 'Available' } : d);
      setDrivers(updatedDrivers);
      persistLocal('ops_drivers', updatedDrivers);
    }
  };

  // 4. Open Maintenance Shop Order
  const openMaintenance = async (vehicleNo, description, cost) => {
    const costNum = parseFloat(cost) || 0;
    const newLog = {
      id: `MNT-${Math.floor(400 + Math.random() * 500)}`,
      vehicle: vehicleNo,
      description,
      cost: costNum,
      date: new Date().toISOString().split('T')[0],
      status: 'Open'
    };

    if (session && !isDemoMode) {
      const { error } = await supabase.from('maintenance_logs').insert([{
        vehicle_reg: vehicleNo,
        description,
        cost: costNum,
        status: 'Open'
      }]);
      if (error) throw error;

      await supabase.from('vehicles').update({ status: 'In Shop' }).eq('reg_no', vehicleNo);
      await loadData();
    } else {
      const updatedLogs = [newLog, ...maintLogs];
      setMaintLogs(updatedLogs);
      persistLocal('ops_maint', updatedLogs);

      const updatedVehicles = vehicles.map(v => v.regNo === vehicleNo ? { ...v, status: 'In Shop' } : v);
      setVehicles(updatedVehicles);
      persistLocal('ops_vehicles', updatedVehicles);
    }
  };

  // 5. Close Maintenance Shop Order
  const closeMaintenance = async (logId, vehicleNo) => {
    if (session && !isDemoMode) {
      const { error } = await supabase.from('maintenance_logs').update({ status: 'Closed' }).eq('id', parseInt(logId));
      if (error) throw error;

      await supabase.from('vehicles').update({ status: 'Available' }).eq('reg_no', vehicleNo);
      await loadData();
    } else {
      const updatedLogs = maintLogs.map(log => log.id === logId ? { ...log, status: 'Closed' } : log);
      setMaintLogs(updatedLogs);
      persistLocal('ops_maint', updatedLogs);

      const updatedVehicles = vehicles.map(v => v.regNo === vehicleNo ? { ...v, status: 'Available' } : v);
      setVehicles(updatedVehicles);
      persistLocal('ops_vehicles', updatedVehicles);
    }
  };

  // 6. Log Fuel receipt
  const logFuelReceipt = async (vehicleNo, liters, cost) => {
    const costNum = parseFloat(cost) || 0;
    const newFuel = {
      id: `FUEL-${Math.floor(900 + Math.random() * 99)}`,
      vehicle: vehicleNo,
      liters: parseFloat(liters) || 0,
      cost: costNum,
      date: new Date().toISOString().split('T')[0]
    };

    if (session && !isDemoMode) {
      const { error } = await supabase.from('fuel_expenses').insert([{
        vehicle_reg: vehicleNo,
        liters: parseFloat(liters) || 0,
        cost: costNum
      }]);
      if (error) throw error;
      await loadData();
    } else {
      const updatedLogs = [newFuel, ...fuelLogs];
      setFuelLogs(updatedLogs);
      persistLocal('ops_fuel', updatedLogs);
    }
  };

  // Live telemetry path movement tick simulator (for Demo Mode active routes)
  useEffect(() => {
    if (isDemoMode || !session) {
      const interval = setInterval(() => {
        setTrips(prevTrips => {
          const next = prevTrips.map(t => t.status === 'Dispatched' ? {
            ...t,
            lat: +(t.lat + (Math.random() - 0.5) * 0.0015).toFixed(6),
            lng: +(t.lng + (Math.random() - 0.5) * 0.0015).toFixed(6)
          } : t);
          persistLocal('ops_trips', next);
          return next;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [session, isDemoMode]);

  // Aggregate fuel & maint costs dynamically for each vehicle
  const vehiclesWithCosts = vehicles.map(v => {
    const fCost = fuelLogs.filter(f => f.vehicle === v.regNo).reduce((sum, f) => sum + f.cost, 0);
    const mCost = maintLogs.filter(m => m.vehicle === v.regNo).reduce((sum, m) => sum + m.cost, 0);
    return {
      ...v,
      fuelCost: fCost,
      maintCost: mCost
    };
  });

  return (
    <DbContext.Provider value={{
      vehicles: vehiclesWithCosts,
      drivers,
      trips,
      maintLogs,
      fuelLogs,
      loading,
      isDemoMode,
      insertVehicle,
      dispatchTrip,
      completeTrip,
      openMaintenance,
      closeMaintenance,
      logFuelReceipt,
      reload: loadData
    }}>
      {children}
    </DbContext.Provider>
  );
}

export const useDb = () => useContext(DbContext);