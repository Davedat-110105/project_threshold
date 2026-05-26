import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Building2, RadioTower, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../context';
import { getTier, TIER_COLORS, scoreFor, formatIncome } from '../utils';
import type { Tract } from '../types';

type Col = 'score' | 'median_income' | 'pct_renters' | 'shelterCount';

const STAT_CARDS = (critical: number, avg: string, noShelter: number, withOutage: number) => [
  { label: 'Critical Zones', value: critical, color: '#F43F5E', icon: <AlertTriangle size={16} /> },
  { label: 'Avg Score', value: avg, color: '#E6EAF0', icon: <TrendingUp size={16} /> },
  { label: 'No Shelter', value: noShelter, color: '#F97316', icon: <Building2 size={16} /> },
  { label: 'Active Outages', value: withOutage, color: withOutage > 0 ? '#F43F5E' : '#34D399', icon: <RadioTower size={16} /> },
] as const;

export default function TriageView() {
  const { tracts, setSelected, setView, scenario } = useApp();
  const [col, setCol] = useState<Col>('score');
  const [asc, setAsc] = useState(false);

  const critical = tracts.filter(t => getTier(scoreFor(t, scenario)) === 'critical').length;
  const noShelter = tracts.filter(t => t.shelterCount === 0).length;
  const withOutage = tracts.filter(t => t.active_outages > 0).length;
  const avg = tracts.length > 0
    ? (tracts.reduce((s, t) => s + scoreFor(t, scenario), 0) / tracts.length).toFixed(1)
    : '—';

  const sorted = [...tracts].sort((a, b) => {
    const av = col === 'score' ? scoreFor(a, scenario) : (a[col] as number);
    const bv = col === 'score' ? scoreFor(b, scenario) : (b[col] as number);
    return asc ? av - bv : bv - av;
  });

  function SortTh({ k, label }: { k: Col; label: string }) {
    const isActive = col === k;
    return (
      <th
        onClick={() => { if (isActive) { setAsc(v => !v); } else { setCol(k); setAsc(false); } }}
        className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer hover:text-primary select-none transition-colors">
        <div className="flex items-center gap-1">
          {label}
          {isActive && (asc
            ? <ChevronUp size={11} className="text-accent" />
            : <ChevronDown size={11} className="text-accent" />)}
        </div>
      </th>
    );
  }

  function handleView(t: Tract) {
    setSelected(t);
    setView('Map');
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-border shrink-0">
        {STAT_CARDS(critical, avg, noShelter, withOutage).map(({ label, value, color, icon }) => (
          <div key={label} className="bg-panel rounded-xl p-3.5 border border-border/60 hover:border-border transition-colors">
            <div className="flex items-center justify-between mb-1">
              <div style={{ color }} className="opacity-70">{icon}</div>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>{value}</div>
            <div className="text-xs text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-panel border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase w-8">#</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase">Neighbourhood</th>
              <SortTh k="score" label="Score" />
              <SortTh k="median_income" label="Income" />
              <SortTh k="pct_renters" label="Renters" />
              <SortTh k="shelterCount" label="Shelters" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const score = scoreFor(t, scenario);
              const color = TIER_COLORS[getTier(score)];
              return (
                <tr key={t.ctuid} className="border-b border-border/40 hover:bg-hover/50 transition-colors">
                  <td className="px-3 py-2.5 text-xs text-muted/60 font-mono tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-xs font-medium text-primary">{t.neighbourhood}</div>
                    <div className="text-xs text-muted/60 font-mono mt-0.5">{t.ctuid}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded-md tabular-nums"
                      style={{ color, background: `${color}1A` }}>
                      {score.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted font-mono tabular-nums">{formatIncome(t.median_income)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted font-mono tabular-nums">{(t.pct_renters * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2.5 text-xs font-mono tabular-nums">
                    {t.shelterCount === 0 ? (
                      <span className="text-critical flex items-center gap-1">
                        <AlertTriangle size={10} />0
                      </span>
                    ) : (
                      <span className="text-muted">{t.shelterCount}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => handleView(t)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-accent/40 text-accent hover:bg-accent hover:text-white transition-all duration-150 cursor-pointer">
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
