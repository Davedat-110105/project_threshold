import React, { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, RadioTower } from 'lucide-react';
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
          className="w-full flex justify-between items-center px-3 py-2 rounded bg-card border border-border text-sm text-primary hover:border-accent/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-muted" />
            <span>Brampton</span>
          </div>
          {open ? <ChevronUp size={13} className="text-muted" /> : <ChevronDown size={13} className="text-muted" />}
        </button>
        {open && (
          <div className="mt-1 rounded border border-border bg-card overflow-hidden">
            {CITIES.map(c => (
              <button key={c.name} disabled={!c.on} onClick={() => c.on && setOpen(false)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer
                  ${c.on ? 'text-primary hover:bg-hover' : 'text-muted cursor-not-allowed opacity-50'}`}>
                {c.name}
                {!c.on && <span className="ml-2 text-xs text-muted/60 bg-border/40 px-1 py-0.5 rounded">soon</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header + tier summary */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="text-sm font-semibold text-primary">Brampton</div>
        <div className="text-xs text-muted mt-0.5">{tracts.length} neighbourhoods · Alectra territory</div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {(['critical', 'high', 'moderate', 'low'] as const).map(tier => {
            const count = sorted.filter(t => getTier(scoreFor(t, scenario)) === tier).length;
            if (count === 0) return null;
            const color = TIER_COLORS[tier];
            return (
              <span key={tier} className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded"
                style={{ color, background: `${color}1A` }}>
                {count} {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </span>
            );
          })}
        </div>
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
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-border/60 transition-colors cursor-pointer
                ${isSel ? 'bg-accent/10 ring-inset ring-1 ring-accent/30' : 'hover:bg-hover'}`}>
              <span className="text-xs text-muted/60 w-5 font-mono shrink-0 tabular-nums">{i + 1}</span>
              <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-mono font-semibold shrink-0 tabular-nums"
                style={{ color, background: `${color}1A` }}>
                {score.toFixed(0)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-primary truncate font-medium">{t.neighbourhood}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color }}>{TIER_LABELS[tier]}</div>
              </div>
              {t.active_outages > 0 && (
                <RadioTower size={12} className="text-critical animate-pulse shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
