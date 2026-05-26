import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Facility, Scenario, Tract, View } from './types';
import { loadData } from './dataLoader';

interface AppState {
  tracts: Tract[];
  facilities: Facility[];
  loading: boolean;
  error: string | null;
  selected: Tract | null;
  scenario: Scenario;
  view: View;
  setSelected: (t: Tract | null) => void;
  setScenario: (s: Scenario) => void;
  setView: (v: View) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Tract | null>(null);
  const [scenario, setScenario] = useState<Scenario>('Baseline');
  const [view, setView] = useState<View>('Map');

  useEffect(() => {
    loadData()
      .then(({ tracts, facilities }) => { setTracts(tracts); setFacilities(facilities); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Ctx.Provider value={{ tracts, facilities, loading, error, selected, scenario, view, setSelected, setScenario, setView }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
