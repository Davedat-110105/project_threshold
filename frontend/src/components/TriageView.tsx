import React, { useState } from 'react';
import { useApp } from '../context';
import { getTier, TIER_COLORS, scoreFor, formatIncome } from '../utils';
import type { Tract } from '../types';

type Col = 'score' | 'median_income' | 'pct_renters' | 'shelterCount';

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
    return (
      <th
        onClick={() => { if (col === k) { setAsc(v => !v); } else { setCol(k); setAsc(false); } }}
        className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer hover:text-primary select-none">
        {label} {col === k ? (asc ? '↑' : '↓') : ''}
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
        {([
          ['Critical Zones', critical, '#ef4444'],
          ['Avg Score', avg, '#F5F5F5'],
          ['No Shelter', noShelter, '#fb923c'],
          ['Active Outages', withOutage, withOutage > 0 ? '#ef4444' : '#4ade80'],
        ] as [string, number | string, string][]).map(([label, val, clr]) => (
          <div key={label} className="bg-panel rounded p-3 border border-border">
            <div className="text-2xl font-bold font-mono" style={{ color: clr }}>{val}</div>
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
                <tr key={t.ctuid} className="border-b border-border hover:bg-hover transition-colors">
                  <td className="px-3 py-2 text-xs text-muted font-mono">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="text-xs font-medium text-primary">{t.neighbourhood}</div>
                    <div className="text-xs text-muted font-mono">{t.ctuid}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ color, background: `${color}22` }}>
                      {score.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted font-mono">{formatIncome(t.median_income)}</td>
                  <td className="px-3 py-2 text-xs text-muted font-mono">{(t.pct_renters * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-xs font-mono">
                    <span className={t.shelterCount === 0 ? 'text-critical' : 'text-muted'}>
                      {t.shelterCount === 0 ? '⚠ 0' : t.shelterCount}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleView(t)}
                      className="text-xs px-2 py-1 rounded border border-accent text-accent hover:bg-accent hover:text-white transition-colors">
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
