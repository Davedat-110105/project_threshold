import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Facility, Scenario, Tract, View } from './types';
import { loadData } from './dataLoader';

export type Theme = 'dark' | 'mono';

interface AppState {
  tracts: Tract[];
  facilities: Facility[];
  loading: boolean;
  error: string | null;
  selected: Tract | null;
  scenario: Scenario;
  view: View;
  theme: Theme;
  setSelected: (t: Tract | null) => void;
  setScenario: (s: Scenario) => void;
  setView: (v: View) => void;
  setTheme: (t: Theme) => void;
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
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    loadData()
      .then(({ tracts, facilities }) => { setTracts(tracts); setFacilities(facilities); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Ctx.Provider value={{ tracts, facilities, loading, error, selected, scenario, view, theme, setSelected, setScenario, setView, setTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
