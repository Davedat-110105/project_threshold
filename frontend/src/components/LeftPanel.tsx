import React, { useState } from 'react';
import { useApp } from '../context';
import { getTier, TIER_COLORS, TIER_LABELS, scoreFor } from '../utils';

const CITIES = [
  { name: 'Brampton', on: true },
  { name: 'Mississauga', on: false },
  { name: 'Hamilton', on: false },
  { name: 'Toronto', on: false },
];

export default function LeftPanel() {
  const { tracts, selected, setSelected, scenario } = useApp();
  const [open, setOpen] = useState(false);
  const sorted = [...tracts].sort((a, b) => scoreFor(b, scenario) - scoreFor(a, scenario));

  return (
    <aside className="w-64 flex flex-col bg-panel border-r border-border overflow-hidden shrink-0">
      {/* City picker */}
      <div className="p-3 border-b border-border">
        <button onClick={() => setOpen(o => !o)}
          className="w-full flex justify-between items-center px-3 py-2 rounded bg-card border border-border text-sm text-primary hover:border-accent transition-colors">
          <span>🏙 Brampton</span>
          <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="mt-1 rounded border border-border bg-card overflow-hidden">
            {CITIES.map(c => (
              <button key={c.name} disabled={!c.on} onClick={() => c.on && setOpen(false)}
                className={`w-full text-left px-3 py-2 text-sm ${c.on ? 'text-primary hover:bg-hover' : 'text-muted cursor-not-allowed'}`}>
                {c.name}{!c.on && <span className="ml-2 text-xs text-muted">soon</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="text-sm font-semibold">Brampton</div>
        <div className="text-xs text-muted">{tracts.length} neighbourhoods · Alectra territory</div>
      </div>

      {/* Ranked list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((t, i) => {
          const score = scoreFor(t, scenario);
          const tier = getTier(score);
          const color = TIER_COLORS[tier];
          const isSel = selected?.ctuid === t.ctuid;
          return (
            <button key={t.ctuid} onClick={() => setSelected(isSel ? null : t)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-border transition-colors ${isSel ? 'bg-card' : 'hover:bg-hover'}`}>
              <span className="text-xs text-muted w-5 font-mono shrink-0">{i + 1}</span>
              <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-mono font-bold shrink-0"
                style={{ color, background: `${color}22` }}>
                {score.toFixed(0)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-primary truncate">{t.neighbourhood}</div>
                <div className="text-xs font-medium" style={{ color }}>{TIER_LABELS[tier]}</div>
              </div>
              {t.active_outages > 0 && <span className="w-2 h-2 rounded-full bg-critical animate-pulse shrink-0" />}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
