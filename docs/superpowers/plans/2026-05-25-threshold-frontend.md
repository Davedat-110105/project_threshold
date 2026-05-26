# Project Threshold Frontend — Static-First UI Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React 18 SPA that renders the Brampton energy-vulnerability choropleth map with all panels working, loading data from static GeoJSON files — no backend required. API integration comes later.

**Architecture:** Vite + React 18 + TypeScript SPA. Data loaded once at startup by fetching `/data/brampton_full.geojson` and `/data/brampton_facilities.geojson` from `public/data/`. Shelter proximity computed client-side. Global state (React Context) holds tracts, facilities, selected tract, active scenario, and view mode. All three panels read from context — swapping static fetches for real API calls later touches only `src/dataLoader.ts`.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3, react-leaflet 4, leaflet 1.9.

---

## File Structure

```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/
│   └── data/
│       ├── brampton_full.geojson        ← copy from pipeline/data/
│       └── brampton_facilities.geojson  ← copy from pipeline/data/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types.ts          ← Tract, Facility, Scenario, Tier, View
    ├── dataLoader.ts     ← loadTracts(): fetch + join shelters + return typed array
    ├── context.tsx       ← AppContext: tracts, facilities, selected, scenario, view
    ├── utils.ts          ← getTier, TIER_COLORS, formatIncome, weatherLabel, haversine
    └── components/
        ├── TopBar.tsx
        ├── LeftPanel.tsx
        ├── MapPanel.tsx
        ├── RightPanel.tsx
        └── TriageView.tsx
```

---

## GeoJSON property reference

`brampton_full.geojson` feature properties (all fields used by the UI):

```
CTUID, neighbourhood, population, median_income, pct_renters, pct_pre1980,
pct_low_income, cisv_score, cisv_dim1, cisv_dim2, cisv_dim3, cisv_dim4,
cisv_quintile, cisr_score, cisr_dim1, cisr_dim2, cisr_dim3, cisr_quintile,
temperature_c, humidex, precipitation_mm, wind_speed_kmh, wind_gusts_kmh,
weather_code, active_outages, customers_affected,
threshold_score_baseline, threshold_score_heatwave, threshold_score_icestorm,
threshold_score, risk_level
```

Geometry type: `Polygon`. All 122 Brampton CTs.

`brampton_facilities.geojson` feature properties:
```
name, address, type, role, website, _source_layer
```
Geometry type: `Point`.

---

## Tier colours and score mapping

```
0–25   → Low      #4ade80
25–50  → Moderate #facc15
50–75  → High     #fb923c
75–100 → Critical #ef4444
```

Score field per scenario:
- `Baseline`   → `threshold_score_baseline`
- `Heatwave`   → `threshold_score_heatwave`
- `Ice Storm`  → `threshold_score_icestorm`

---

### Task 1: Scaffold + Data Layer

**What this builds:** All config files, the Vite dev server running, static GeoJSON files in place, and the `loadTracts()` function that returns fully-typed `Tract[]` with shelter counts.

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/styles/index.css`
- Create: `frontend/src/types.ts`
- Create: `frontend/src/utils.ts`
- Create: `frontend/src/dataLoader.ts`
- Copy (shell command): `pipeline/data/brampton_full.geojson` → `frontend/public/data/`
- Copy (shell command): `pipeline/data/brampton_facilities.geojson` → `frontend/public/data/`

- [ ] **Step 1: Create frontend/package.json**

```json
{
  "name": "threshold-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.12",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.2.13"
  }
}
```

- [ ] **Step 2: Create frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 3: Create frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create frontend/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     '#0D0D0D',
        panel:    '#141414',
        card:     '#1A1A1A',
        hover:    '#212121',
        border:   '#2A2A2A',
        primary:  '#F5F5F5',
        muted:    '#6B7280',
        accent:   '#2563EB',
        orange:   '#F97316',
        low:      '#4ade80',
        moderate: '#facc15',
        high:     '#fb923c',
        critical: '#ef4444',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Create frontend/postcss.config.js**

```javascript
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 6: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Project Threshold</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create frontend/src/styles/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

body {
  background: #0D0D0D;
  color: #F5F5F5;
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  overflow: hidden;
}

.leaflet-container { background: #0D0D0D !important; }
.leaflet-popup-content-wrapper {
  background: #1A1A1A;
  color: #F5F5F5;
  border: 1px solid #2A2A2A;
  border-radius: 8px;
  box-shadow: none;
}
.leaflet-popup-tip { background: #1A1A1A; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 2px; }
```

- [ ] **Step 8: Create frontend/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 9: Create frontend/src/types.ts**

```typescript
export type Scenario = 'Baseline' | 'Heatwave' | 'Ice Storm';
export type Tier = 'low' | 'moderate' | 'high' | 'critical';
export type View = 'Map' | 'Triage';

export interface Tract {
  // Identity
  ctuid: string;
  neighbourhood: string;
  // Geometry (centroid, computed from polygon ring)
  lat: number;
  lng: number;
  // Raw GeoJSON geometry (for Leaflet choropleth layer)
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  };
  // Demographics
  population: number;
  median_income: number;
  pct_renters: number;
  pct_pre1980: number;
  pct_low_income: number;
  // CISV
  cisv_score: number;
  cisv_dim1: number;
  cisv_dim2: number;
  cisv_dim3: number;
  cisv_dim4: number;
  cisv_quintile: number;
  // CISR
  cisr_score: number;
  cisr_quintile: number;
  // Weather
  temperature_c: number;
  humidex: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  weather_code: number;
  // Outages
  active_outages: number;
  customers_affected: number;
  // Scores (pre-computed PCA)
  threshold_score_baseline: number;
  threshold_score_heatwave: number;
  threshold_score_icestorm: number;
  risk_level: string;
  // Computed at load time
  shelterCount: number;
  shelterList: string[];
}

export interface Facility {
  name: string;
  address: string;
  role: string;
  lat: number;
  lng: number;
}
```

- [ ] **Step 10: Create frontend/src/utils.ts**

```typescript
import type { Scenario, Tier } from './types';

export function scoreFor(tract: { threshold_score_baseline: number; threshold_score_heatwave: number; threshold_score_icestorm: number }, scenario: Scenario): number {
  if (scenario === 'Heatwave') return tract.threshold_score_heatwave;
  if (scenario === 'Ice Storm') return tract.threshold_score_icestorm;
  return tract.threshold_score_baseline;
}

export function getTier(score: number): Tier {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

export const TIER_COLORS: Record<Tier, string> = {
  low:      '#4ade80',
  moderate: '#facc15',
  high:     '#fb923c',
  critical: '#ef4444',
};

export const TIER_LABELS: Record<Tier, string> = {
  low:      'Low',
  moderate: 'Moderate',
  high:     'High',
  critical: 'Critical',
};

export function formatIncome(v: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(v);
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorm';
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

- [ ] **Step 11: Create frontend/src/dataLoader.ts**

```typescript
import type { Facility, Tract } from './types';
import { haversineKm } from './utils';

function centroid(coords: number[][][]): [number, number] {
  const ring = coords[0];
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  return [lat, lng];
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

export async function loadData(): Promise<{ tracts: Tract[]; facilities: Facility[] }> {
  const [tractsGJ, facilsGJ] = await Promise.all([
    fetch('/data/brampton_full.geojson').then(r => r.json()),
    fetch('/data/brampton_facilities.geojson').then(r => r.json()),
  ]);

  const facilities: Facility[] = (facilsGJ.features as { geometry: { coordinates: number[] }; properties: Record<string, string> }[]).map(f => ({
    name: f.properties.name ?? '',
    address: f.properties.address ?? '',
    role: f.properties.role ?? '',
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));

  const tracts: Tract[] = (tractsGJ.features as { geometry: { type: 'Polygon'; coordinates: number[][][] }; properties: Record<string, unknown> }[]).map(f => {
    const p = f.properties;
    const [lat, lng] = centroid(f.geometry.coordinates);

    const nearby = facilities.filter(fac => haversineKm(lat, lng, fac.lat, fac.lng) <= 2.5);

    return {
      ctuid: String(p.CTUID ?? ''),
      neighbourhood: String(p.neighbourhood ?? p.CTUID ?? ''),
      lat,
      lng,
      geometry: f.geometry,
      population: num(p.population),
      median_income: num(p.median_income),
      pct_renters: num(p.pct_renters),
      pct_pre1980: num(p.pct_pre1980),
      pct_low_income: Math.min(num(p.pct_low_income), 1),
      cisv_score: num(p.cisv_score),
      cisv_dim1: num(p.cisv_dim1),
      cisv_dim2: num(p.cisv_dim2),
      cisv_dim3: num(p.cisv_dim3),
      cisv_dim4: num(p.cisv_dim4),
      cisv_quintile: num(p.cisv_quintile),
      cisr_score: num(p.cisr_score),
      cisr_quintile: num(p.cisr_quintile),
      temperature_c: num(p.temperature_c, 20),
      humidex: num(p.humidex, 20),
      precipitation_mm: num(p.precipitation_mm),
      wind_speed_kmh: num(p.wind_speed_kmh),
      wind_gusts_kmh: num(p.wind_gusts_kmh),
      weather_code: num(p.weather_code),
      active_outages: num(p.active_outages),
      customers_affected: num(p.customers_affected),
      threshold_score_baseline: num(p.threshold_score_baseline),
      threshold_score_heatwave: num(p.threshold_score_heatwave),
      threshold_score_icestorm: num(p.threshold_score_icestorm),
      risk_level: String(p.risk_level ?? 'Moderate'),
      shelterCount: nearby.length,
      shelterList: nearby.map(f => f.name),
    };
  });

  return { tracts, facilities };
}
```

- [ ] **Step 12: Copy GeoJSON files into frontend/public/data/**

```bash
mkdir -p frontend/public/data
cp pipeline/data/brampton_full.geojson frontend/public/data/
cp pipeline/data/brampton_facilities.geojson frontend/public/data/
```

- [ ] **Step 13: Install deps and verify dev server starts**

```bash
cd frontend && npm install && npm run dev
```

Expected: Vite dev server starts at http://localhost:5173 with no errors (blank page is fine).

- [ ] **Step 14: Commit**

```bash
git add frontend/
git commit -m "feat: React scaffold + data loader (static GeoJSON, shelter join)"
```

---

### Task 2: Context + App Shell + TopBar

**Files:**
- Create: `frontend/src/context.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/components/TopBar.tsx`

- [ ] **Step 1: Create frontend/src/context.tsx**

```tsx
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
```

- [ ] **Step 2: Create frontend/src/components/TopBar.tsx**

```tsx
import React from 'react';
import { useApp } from '../context';
import type { Scenario, View } from '../types';

const SCENARIOS: Scenario[] = ['Baseline', 'Heatwave', 'Ice Storm'];

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
        {(['Map', 'Triage'] as View[]).map(v => (
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
```

- [ ] **Step 3: Create frontend/src/App.tsx**

```tsx
import React from 'react';
import { AppProvider, useApp } from './context';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import MapPanel from './components/MapPanel';
import RightPanel from './components/RightPanel';
import TriageView from './components/TriageView';

// Placeholder stubs — replaced in later tasks
function LeftPanel_() { return <div className="w-64 bg-panel border-r border-border shrink-0" />; }
function MapPanel_() { return <div className="flex-1 bg-base flex items-center justify-center text-muted text-sm">Map loading…</div>; }
function RightPanel_() { return <div className="w-80 bg-panel border-l border-border shrink-0" />; }
function TriageView_() { return <div className="flex-1 p-6 text-muted">Triage</div>; }

function Shell() {
  const { view, loading, error } = useApp();
  if (loading) return <div className="flex-1 flex items-center justify-center text-muted">Loading data…</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-critical">Error: {error}</div>;
  if (view === 'Triage') return <TriageView_ />;
  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftPanel_ />
      <MapPanel_ />
      <RightPanel_ />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-base text-primary">
        <TopBar />
        <Shell />
      </div>
    </AppProvider>
  );
}
```

- [ ] **Step 4: Verify in browser**

```bash
cd frontend && npm run dev
```

Open http://localhost:5173. Expected: dark header with ⚡ logo, scenario buttons, Map/Triage tabs, "Loading data…" then "Map loading…" text. No console errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: App shell, context, TopBar — data loads from static GeoJSON"
```

---

### Task 3: LeftPanel + MapPanel

**What this builds:** The visual core — ranked neighbourhood list on the left and Leaflet choropleth in the center. After this task the map is fully interactive.

**Files:**
- Create: `frontend/src/components/LeftPanel.tsx`
- Create: `frontend/src/components/MapPanel.tsx`
- Modify: `frontend/src/App.tsx` (swap stubs for real components)

- [ ] **Step 1: Create frontend/src/components/LeftPanel.tsx**

```tsx
import React, { useState } from 'react';
import { useApp } from '../context';
import { getTier, TIER_COLORS, scoreFor } from '../utils';

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
                <div className="text-xs font-medium" style={{ color }}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
              </div>
              {t.active_outages > 0 && <span className="w-2 h-2 rounded-full bg-critical animate-pulse shrink-0" />}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create frontend/src/components/MapPanel.tsx**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context';
import { getTier, TIER_COLORS, scoreFor } from '../utils';
import type { Tract } from '../types';

const SHELTER_ICON = L.divIcon({ html: '🏠', className: 'text-sm leading-none', iconSize: [20, 20], iconAnchor: [10, 10] });

export default function MapPanel() {
  const { tracts, facilities, selected, setSelected, scenario } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [showShelters, setShowShelters] = useState(true);
  const [showOutages, setShowOutages] = useState(true);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [43.72, -79.77], zoom: 11 });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Choropleth — redraw when scenario or selection changes
  useEffect(() => {
    if (!mapRef.current || tracts.length === 0) return;
    if (geoRef.current) { geoRef.current.remove(); geoRef.current = null; }

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: tracts.map(t => ({
        type: 'Feature' as const,
        geometry: t.geometry as GeoJSON.Geometry,
        properties: { ctuid: t.ctuid },
      })),
    };

    const tractMap = new Map(tracts.map(t => [t.ctuid, t]));

    const layer = L.geoJSON(geojson, {
      style: (feat) => {
        const t = tractMap.get(feat?.properties?.ctuid as string);
        if (!t) return { fillOpacity: 0 };
        const score = scoreFor(t, scenario);
        const color = TIER_COLORS[getTier(score)];
        const isSel = selected?.ctuid === t.ctuid;
        return { fillColor: color, fillOpacity: isSel ? 0.85 : 0.55, color: isSel ? color : '#222', weight: isSel ? 2 : 0.8 };
      },
      onEachFeature: (feat, lyr) => {
        const t = tractMap.get(feat.properties?.ctuid as string);
        if (!t) return;
        const score = scoreFor(t, scenario);
        const tier = getTier(score);

        lyr.on('mouseover', () => {
          (lyr as L.Path).setStyle({ fillOpacity: 0.8 });
          lyr.bindTooltip(`<strong>${t.neighbourhood}</strong><br/>${score.toFixed(1)} · ${tier}`, { sticky: true }).openTooltip();
        });
        lyr.on('mouseout', () => layer.resetStyle(lyr as L.Path));
        lyr.on('click', () => setSelected(selected?.ctuid === t.ctuid ? null : t));
      },
    });

    layer.addTo(mapRef.current!);
    geoRef.current = layer;
  }, [tracts, scenario, selected, setSelected]);

  // Overlay markers
  useEffect(() => {
    if (!markersRef.current) return;
    markersRef.current.clearLayers();

    if (showShelters) {
      const seen = new Set<string>();
      facilities.forEach(f => {
        const key = `${f.lat.toFixed(3)},${f.lng.toFixed(3)}`;
        if (seen.has(key)) return;
        seen.add(key);
        L.marker([f.lat, f.lng], { icon: SHELTER_ICON }).bindTooltip(f.name).addTo(markersRef.current!);
      });
    }

    if (showOutages) {
      tracts.filter(t => t.active_outages > 0).forEach(t => {
        const icon = L.divIcon({
          html: '<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid #fff"></div>',
          className: '', iconSize: [10, 10], iconAnchor: [5, 5],
        });
        L.marker([t.lat, t.lng], { icon }).bindTooltip(`Outage · ${t.customers_affected} customers`).addTo(markersRef.current!);
      });
    }
  }, [tracts, facilities, showShelters, showOutages]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Toggle buttons */}
      <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1">
        {([['🏠 Shelters', showShelters, setShowShelters], ['⚡ Outages', showOutages, setShowOutages]] as const).map(([label, on, toggle]) => (
          <button key={label as string} onClick={() => (toggle as React.Dispatch<React.SetStateAction<boolean>>)(v => !v)}
            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${on ? 'bg-card border-accent text-accent' : 'bg-card border-border text-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-card border border-border rounded p-2 text-xs space-y-0.5">
        {(['low', 'moderate', 'high', 'critical'] as const).map(tier => (
          <div key={tier} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: TIER_COLORS[tier] }} />
            <span className="text-muted capitalize">{tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update App.tsx — swap stubs for real components**

Replace the entire `App.tsx` with:

```tsx
import React from 'react';
import { AppProvider, useApp } from './context';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import MapPanel from './components/MapPanel';
import RightPanel from './components/RightPanel';
import TriageView from './components/TriageView';

function RightPanel_() { return <div className="w-80 bg-panel border-l border-border shrink-0 flex items-center justify-center text-muted text-xs p-4 text-center">Select a neighbourhood</div>; }
function TriageView_() { return <div className="flex-1 p-6 text-muted">Triage</div>; }

function Shell() {
  const { view, loading, error } = useApp();
  if (loading) return <div className="flex-1 flex items-center justify-center text-muted">Loading data…</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-critical">Error: {error}</div>;
  if (view === 'Triage') return <TriageView_ />;
  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftPanel />
      <MapPanel />
      <RightPanel_ />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-base text-primary">
        <TopBar />
        <Shell />
      </div>
    </AppProvider>
  );
}
```

- [ ] **Step 4: Create placeholder RightPanel and TriageView so imports resolve**

Create `frontend/src/components/RightPanel.tsx`:
```tsx
export default function RightPanel() { return null; }
```

Create `frontend/src/components/TriageView.tsx`:
```tsx
export default function TriageView() { return null; }
```

- [ ] **Step 5: Verify in browser**

Open http://localhost:5173. Expected:
- Dark Carto basemap with 122 coloured polygons on Brampton
- Left panel shows ranked neighbourhood list (122 rows)
- Hovering a polygon shows tooltip
- Clicking a polygon or list row highlights it (selected state)
- Switching Baseline/Heatwave/Ice Storm recolours map and re-ranks list
- Shelter house icons visible (toggle on/off works)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: LeftPanel + MapPanel — choropleth, scenario switching, shelter markers"
```

---

### Task 4: RightPanel

**Files:**
- Modify: `frontend/src/components/RightPanel.tsx`

- [ ] **Step 1: Replace RightPanel.tsx with full implementation**

```tsx
import React, { useState } from 'react';
import { useApp } from '../context';
import { getTier, TIER_COLORS, scoreFor, formatIncome, formatPct, weatherLabel } from '../utils';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-2.5 hover:bg-hover transition-colors">
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">{title}</span>
        <span className="text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function Bar({ label, value, max = 1, color = '#2563EB' }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(Math.max(value / max, 0), 1) * 100;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-muted mb-0.5">
        <span>{label}</span>
        <span className="font-mono">{(value * 100 / max * max).toFixed(value < 10 ? 2 : 0)}{max === 1 ? '%' : ''}</span>
      </div>
      <div className="h-1.5 rounded-full bg-hover">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function RightPanel() {
  const { selected, scenario } = useApp();
  const [reportText, setReportText] = useState('');

  if (!selected) {
    return (
      <aside className="w-80 bg-panel border-l border-border flex flex-col items-center justify-center text-center p-6 shrink-0">
        <div className="text-4xl mb-3">🗺</div>
        <div className="text-sm font-medium text-muted mb-1">Select a neighbourhood</div>
        <div className="text-xs text-muted">Click a polygon on the map or a row in the list</div>
      </aside>
    );
  }

  const score = scoreFor(selected, scenario);
  const tier = getTier(score);
  const color = TIER_COLORS[tier];
  const energyPct = selected.median_income > 0 ? ((2400 / selected.median_income) * 100).toFixed(0) : '—';
  const cityMedian = 88000;

  return (
    <aside className="w-80 bg-panel border-l border-border flex flex-col overflow-y-auto shrink-0">
      {/* Score header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-sm text-primary">{selected.neighbourhood}</div>
            <div className="text-xs text-muted font-mono">CT {selected.ctuid}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono" style={{ color }}>{score.toFixed(0)}</div>
            <div className="text-xs font-medium" style={{ color }}>{tier.charAt(0).toUpperCase() + tier.slice(1)} Risk</div>
          </div>
        </div>
        <div className="mt-2 flex gap-1 flex-wrap">
          <span className="text-xs px-1.5 py-0.5 rounded border border-orange text-orange bg-card">⚡ Alectra</span>
          {selected.active_outages > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded border border-critical text-critical bg-card animate-pulse">
              {selected.active_outages} outage{selected.active_outages > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Live weather */}
      <Section title="Live Weather">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {[
            ['Temperature', `${selected.temperature_c.toFixed(1)}°C`],
            ['Humidex', `${selected.humidex.toFixed(1)}°C`],
            ['Wind', `${selected.wind_speed_kmh.toFixed(0)} km/h`],
            ['Conditions', weatherLabel(selected.weather_code)],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-muted">{k}</div>
              <div className="font-mono text-primary">{v}</div>
            </div>
          ))}
        </div>
        {selected.humidex >= 38 && (
          <div className="mt-2 text-xs px-2 py-1 rounded bg-critical/10 text-critical border border-critical/30">
            ⚠ Heat stress risk — humidex ≥ 38°C
          </div>
        )}
      </Section>

      {/* Vulnerability breakdown */}
      <Section title="Vulnerability Breakdown">
        <Bar label="Social Vulnerability (CISV)" value={Math.max(selected.cisv_score, 0)} max={1.2} color={color} />
        <Bar label="Renter Households" value={selected.pct_renters} color="#fb923c" />
        <Bar label="Pre-1980 Housing" value={selected.pct_pre1980} color="#f59e0b" />
        <Bar label="Low Income Share" value={selected.pct_low_income} color="#ef4444" />
        <Bar label="Resilience (CISR) ↑ better" value={Math.max(selected.cisr_score, 0)} max={2} color="#4ade80" />
      </Section>

      {/* CISV */}
      <Section title="Social Vulnerability (CISV)">
        <div className="text-xs text-muted mb-2">Quintile <span className="text-primary font-semibold">{selected.cisv_quintile}/5</span> nationally (5 = most vulnerable)</div>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['Racialized & Immigration', selected.cisv_dim1],
            ['Income & Labour', selected.cisv_dim2],
            ['Education & Indigenous', selected.cisv_dim3],
            ['Dwelling Conditions', selected.cisv_dim4],
          ] as [string, number][]).map(([label, val]) => {
            const w = Math.min(Math.abs(val) / 1.5, 1) * 100;
            return (
              <div key={label} className="bg-card rounded p-2">
                <div className="text-xs text-muted leading-tight mb-1">{label}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary">{val.toFixed(2)}</span>
                  <div className="h-1.5 rounded-full bg-hover w-12 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${w}%`, background: val >= 0 ? '#fb923c' : '#4ade80' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Income */}
      <Section title="Income & Energy Poverty">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <div className="text-muted">Median Income</div>
            <div className="font-mono text-primary">{formatIncome(selected.median_income)}</div>
          </div>
          <div>
            <div className="text-muted">vs. City ($88k)</div>
            <div className={`font-mono ${selected.median_income < cityMedian ? 'text-critical' : 'text-low'}`}>
              {selected.median_income < cityMedian ? '▼' : '▲'} {formatPct(Math.abs(selected.median_income - cityMedian) / cityMedian)}
            </div>
          </div>
          <div>
            <div className="text-muted">Est. Energy % Income</div>
            <div className={`font-mono ${Number(energyPct) > 6 ? 'text-critical' : 'text-primary'}`}>~{energyPct}%</div>
          </div>
          <div>
            <div className="text-muted">Pre-1980 Homes</div>
            <div className="font-mono text-primary">{formatPct(selected.pct_pre1980)}</div>
          </div>
        </div>
      </Section>

      {/* Shelters */}
      <Section title="Cooling & Warming Centres">
        {selected.shelterCount === 0 ? (
          <div className="text-xs text-critical flex gap-1.5"><span>⚠</span><span>No shelter within 2.5 km</span></div>
        ) : (
          <>
            <div className="text-xs text-muted mb-1">{selected.shelterCount} within 2.5 km</div>
            {selected.shelterList.slice(0, 3).map(name => (
              <div key={name} className="text-xs text-primary py-1 border-b border-border last:border-0">🏠 {name}</div>
            ))}
            {selected.shelterList.length > 3 && <div className="text-xs text-muted mt-1">+{selected.shelterList.length - 3} more</div>}
          </>
        )}
      </Section>

      {/* Reports */}
      <Section title="Community Reports">
        <div className="text-xs text-muted mb-2">No community reports yet.</div>
        <textarea value={reportText} onChange={e => setReportText(e.target.value)}
          placeholder="Report a condition in this area…" rows={2}
          className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-primary placeholder-muted resize-none focus:outline-none focus:border-accent" />
        <button onClick={() => setReportText('')} disabled={!reportText.trim()}
          className="mt-1 px-3 py-1 rounded text-xs bg-accent text-white disabled:opacity-40">
          Submit
        </button>
      </Section>

      {/* Actions */}
      <Section title="Actions">
        {['📋 Generate outreach plan', '📑 Copy report', '🔗 Find programs'].map(a => (
          <button key={a} className="w-full text-xs px-3 py-2 rounded border border-border text-muted hover:bg-hover text-left mb-1 transition-colors">{a}</button>
        ))}
      </Section>
    </aside>
  );
}
```

- [ ] **Step 2: Wire RightPanel into App.tsx**

In `frontend/src/App.tsx`, replace the `RightPanel_` stub and its import with the real component:

```tsx
import React from 'react';
import { AppProvider, useApp } from './context';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import MapPanel from './components/MapPanel';
import RightPanel from './components/RightPanel';
import TriageView from './components/TriageView';

function TriageView_() { return <div className="flex-1 p-6 text-muted">Triage</div>; }

function Shell() {
  const { view, loading, error } = useApp();
  if (loading) return <div className="flex-1 flex items-center justify-center text-muted">Loading data…</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-critical">Error: {error}</div>;
  if (view === 'Triage') return <TriageView_ />;
  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftPanel />
      <MapPanel />
      <RightPanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-base text-primary">
        <TopBar />
        <Shell />
      </div>
    </AppProvider>
  );
}
```

- [ ] **Step 3: Verify in browser**

Click a neighbourhood. Expected:
- Score number in tier colour, neighbourhood name, CT ID
- Alectra chip + outage badge (if applicable)
- Weather: temperature, humidex, wind, conditions
- Vulnerability bars (CISV, renters, pre-1980, low income, resilience)
- CISV 4-dimension grid with mini bars
- Income section with city-median comparison
- Shelters list or "no shelter" warning
- Reports section with textarea
- Action buttons

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/RightPanel.tsx frontend/src/App.tsx
git commit -m "feat: RightPanel — score, weather, vulnerability, CISV, income, shelters, actions"
```

---

### Task 5: TriageView + Build Verification

**Files:**
- Modify: `frontend/src/components/TriageView.tsx`
- Modify: `frontend/src/App.tsx` (wire TriageView)

- [ ] **Step 1: Replace TriageView.tsx with full implementation**

```tsx
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
  const avg = (tracts.reduce((s, t) => s + scoreFor(t, scenario), 0) / Math.max(tracts.length, 1)).toFixed(1);

  const sorted = [...tracts].sort((a, b) => {
    const av = col === 'score' ? scoreFor(a, scenario) : a[col];
    const bv = col === 'score' ? scoreFor(b, scenario) : b[col];
    return asc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  function th(key: Col, label: string) {
    return (
      <th onClick={() => col === key ? setAsc(v => !v) : (setCol(key), setAsc(false))}
        className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer hover:text-primary">
        {label} {col === key ? (asc ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 p-4 border-b border-border shrink-0">
        {[
          { label: 'Critical Zones', val: critical, color: '#ef4444' },
          { label: 'Avg Score', val: avg, color: '#F5F5F5' },
          { label: 'No Shelter', val: noShelter, color: '#fb923c' },
          { label: 'Active Outages', val: withOutage, color: withOutage > 0 ? '#ef4444' : '#4ade80' },
        ].map(s => (
          <div key={s.label} className="bg-panel rounded p-3 border border-border">
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs text-muted mt-0.5">{s.label}</div>
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
              {th('score', 'Score')}
              {th('median_income', 'Income')}
              {th('pct_renters', 'Renters')}
              {th('shelterCount', 'Shelters')}
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
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ color, background: `${color}22` }}>
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
                    <button onClick={() => { setSelected(t); setView('Map'); }}
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
```

- [ ] **Step 2: Wire TriageView into App.tsx**

Replace the `TriageView_` stub in `App.tsx` — import and use the real `TriageView` component:

```tsx
import React from 'react';
import { AppProvider, useApp } from './context';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import MapPanel from './components/MapPanel';
import RightPanel from './components/RightPanel';
import TriageView from './components/TriageView';

function Shell() {
  const { view, loading, error } = useApp();
  if (loading) return <div className="flex-1 flex items-center justify-center text-muted">Loading data…</div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-critical">Error: {error}</div>;
  if (view === 'Triage') return <TriageView />;
  return (
    <div className="flex flex-1 overflow-hidden">
      <LeftPanel />
      <MapPanel />
      <RightPanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="flex flex-col h-screen bg-base text-primary">
        <TopBar />
        <Shell />
      </div>
    </AppProvider>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd frontend && npm run build
```

Fix any type errors that appear. Common fixes:
- Add `as const` to literal arrays
- Cast unknown Leaflet callback params with `as`
- Remove unused imports

- [ ] **Step 4: Full browser walkthrough**

1. Map loads with 122 coloured polygons ✓
2. Left panel shows 122 ranked rows ✓
3. Switch Heatwave → map recolours, list re-ranks ✓
4. Click polygon → right panel fills with score, weather, breakdown ✓
5. Click Triage → stats cards + 122-row sortable table ✓
6. Click "View" in triage → returns to map with that neighbourhood selected ✓

- [ ] **Step 5: Final commit**

```bash
git add frontend/
git commit -m "feat: complete Threshold UI — choropleth, panels, triage, scenario switching"
```
