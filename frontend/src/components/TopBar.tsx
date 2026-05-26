import React from 'react';
import { Zap, Map, TableProperties, Circle } from 'lucide-react';
import { useApp } from '../context';
import type { Scenario, View } from '../types';

const SCENARIOS: Scenario[] = ['Baseline', 'Heatwave', 'Ice Storm'];
const VIEWS: { key: View; icon: React.ReactNode }[] = [
  { key: 'Map', icon: <Map size={13} /> },
  { key: 'Triage', icon: <TableProperties size={13} /> },
];

export default function TopBar() {
  const { view, setView, scenario, setScenario, theme, setTheme } = useApp();
  return (
    <header className="flex items-center justify-between px-4 h-12 bg-panel border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-orange fill-orange/20" />
        <span className="font-serif font-semibold text-primary text-sm tracking-tight">Threshold</span>
        <span className="text-muted text-xs hidden sm:inline opacity-60">· Brampton Energy Vulnerability</span>
        <span className="flex items-center gap-1 text-xs text-muted/60 hidden sm:flex">
          <span className="w-1.5 h-1.5 rounded-full bg-low animate-pulse inline-block" />
          <span className="text-low/80 text-xs">live</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        {VIEWS.map(({ key, icon }) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-150 cursor-pointer
              ${view === key
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'text-muted hover:text-primary hover:bg-hover border border-transparent'}`}>
            {icon}{key}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {SCENARIOS.map(s => (
          <button key={s} onClick={() => setScenario(s)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-all duration-150 cursor-pointer
              ${scenario === s
                ? 'border-orange/60 text-orange bg-orange/10'
                : 'border-transparent text-muted hover:text-primary hover:border-border'}`}>
            {s}
          </button>
        ))}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'mono' : 'dark')}
          title={theme === 'dark' ? 'Switch to mono' : 'Switch to dark'}
          className="ml-2 flex items-center justify-center w-7 h-7 rounded border border-border text-muted hover:text-primary hover:border-primary transition-all duration-150 cursor-pointer">
          <Circle size={12} className={theme === 'mono' ? 'fill-primary' : 'fill-none'} />
        </button>
      </div>
    </header>
  );
}
