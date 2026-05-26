import React from 'react';
import { useApp } from '../context';
import type { Scenario, View } from '../types';

const SCENARIOS: Scenario[] = ['Baseline', 'Heatwave', 'Ice Storm'];
const VIEWS: View[] = ['Map', 'Triage'];

export default function TopBar() {
  const { view, setView, scenario, setScenario } = useApp();
  return (
    <header className="flex items-center justify-between px-4 h-12 bg-panel border-b border-border shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-orange font-bold text-lg">⚡</span>
        <span className="font-semibold text-primary text-sm">Project Threshold</span>
        <span className="text-muted text-xs hidden sm:inline">· Brampton Energy Vulnerability</span>
      </div>

      <div className="flex items-center gap-1">
        {VIEWS.map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === v ? 'bg-accent text-white' : 'text-muted hover:text-primary hover:bg-hover'}`}>
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {SCENARIOS.map(s => (
          <button key={s} onClick={() => setScenario(s)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${scenario === s ? 'border-orange text-orange bg-card' : 'border-transparent text-muted hover:text-primary'}`}>
            {s}
          </button>
        ))}
      </div>
    </header>
  );
}
