import type { Facility, Tract } from './types';
import { haversineKm } from './utils';

interface CommunitySummary {
  ctuid: string;
  neighbourhood: string;
  population: number | null;
  median_income: number | null;
  pct_renters: number | null;
  pct_pre1980: number | null;
  pct_low_income: number | null;
  cisv_score: number | null;
  cisr_score: number | null;
  humidex: number | null;
  temperature_c: number | null;
  active_outages: number;
  customers_affected: number;
  threshold_score_baseline: number | null;
  threshold_score_heatwave: number | null;
  threshold_score_icestorm: number | null;
  risk_level: string | null;
}

interface CommunityFeature {
  type: 'Feature';
  id: string;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][][] } | null;
  properties: CommunitySummary;
}

interface Envelope<T> {
  data: T;
  sources: unknown[];
  generated_at: string;
}

function centroid(geometry: CommunityFeature['geometry']): [number, number] {
  if (!geometry) return [43.73, -79.76];
  const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  return [lat, lng];
}

function num(v: number | null | undefined, fallback = 0): number {
  return v == null || Number.isNaN(v) ? fallback : v;
}

export async function loadData(): Promise<{ tracts: Tract[]; facilities: Facility[] }> {
  const [commRes, facilRes] = await Promise.all([
    fetch('/api/communities/features').then(r => r.json()) as Promise<Envelope<{ type: string; features: CommunityFeature[] }>>,
    fetch('/api/facilities').then(r => r.json()) as Promise<Envelope<{ type: string; features: { geometry: { coordinates: number[] }; properties: Record<string, string> }[] }>>,
  ]);

  const facilities: Facility[] = (facilRes.data?.features ?? []).map(f => ({
    name: f.properties.name ?? '',
    address: f.properties.address ?? '',
    role: f.properties.role ?? '',
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));

  const tracts: Tract[] = (commRes.data?.features ?? []).map(f => {
    const p = f.properties;
    const [lat, lng] = centroid(f.geometry);
    const nearby = facilities.filter(fac => haversineKm(lat, lng, fac.lat, fac.lng) <= 2.5);

    return {
      ctuid: p.ctuid,
      neighbourhood: p.neighbourhood || p.ctuid,
      lat,
      lng,
      geometry: f.geometry as Tract['geometry'],
      population: num(p.population),
      median_income: num(p.median_income),
      pct_renters: num(p.pct_renters),
      pct_pre1980: num(p.pct_pre1980),
      pct_low_income: Math.min(num(p.pct_low_income), 1),
      cisv_score: num(p.cisv_score),
      cisv_dim1: 0,
      cisv_dim2: 0,
      cisv_dim3: 0,
      cisv_dim4: 0,
      cisv_quintile: 0,
      cisr_score: num(p.cisr_score),
      cisr_quintile: 0,
      temperature_c: num(p.temperature_c, 20),
      humidex: num(p.humidex, 20),
      precipitation_mm: 0,
      wind_speed_kmh: 0,
      wind_gusts_kmh: 0,
      weather_code: 0,
      active_outages: num(p.active_outages),
      customers_affected: num(p.customers_affected),
      threshold_score_baseline: num(p.threshold_score_baseline),
      threshold_score_heatwave: num(p.threshold_score_heatwave),
      threshold_score_icestorm: num(p.threshold_score_icestorm),
      risk_level: p.risk_level ?? 'Moderate',
      shelterCount: nearby.length,
      shelterList: nearby.map(fac => fac.name),
    };
  });

  return { tracts, facilities };
}
