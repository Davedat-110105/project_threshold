import type { Facility, Hospital, LtcHome, NearbyHospital, Tract } from './types';
import { haversineKm } from './utils';

interface LtcFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { name: string; address: string; beds: number | null };
}

interface HospitalFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    name: string;
    address: string;
    type: string;
    emergency_24_7: boolean;
  };
}

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = (yi > lat) !== (yj > lat) &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInTract(lng: number, lat: number, geom: Tract['geometry']): boolean {
  if (!geom) return false;
  if (geom.type === 'Polygon') {
    const [outer, ...holes] = geom.coordinates as unknown as number[][][];
    if (!pointInRing(lng, lat, outer)) return false;
    return !holes.some(h => pointInRing(lng, lat, h));
  }
  const polys = geom.coordinates as unknown as number[][][][];
  for (const poly of polys) {
    const [outer, ...holes] = poly;
    if (pointInRing(lng, lat, outer) && !holes.some(h => pointInRing(lng, lat, h))) {
      return true;
    }
  }
  return false;
}

interface CommunitySummary {
  ctuid: string;
  neighbourhood: string;
  population: number | null;
  median_income: number | null;
  pct_renters: number | null;
  pct_pre1980: number | null;
  pct_low_income: number | null;
  pct_seniors_65plus: number | null;
  pct_children_under5: number | null;
  pct_living_alone: number | null;
  pct_no_official_lang: number | null;
  pct_transit_commute: number | null;
  cisv_score: number | null;
  cisv_dim1: number | null;
  cisv_dim2: number | null;
  cisv_dim3: number | null;
  cisv_dim4: number | null;
  cisv_quintile: number | null;
  cisr_score: number | null;
  cisr_quintile: number | null;
  humidex: number | null;
  temperature_c: number | null;
  precipitation_mm: number | null;
  wind_speed_kmh: number | null;
  wind_gusts_kmh: number | null;
  weather_code: number | null;
  aqhi: number | null;
  aqhi_band: string | null;
  pm25: number | null;
  pm10: number | null;
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
  const ring = (geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0]) as number[][];
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  return [lat, lng];
}

function num(v: number | null | undefined, fallback = 0): number {
  return v == null || Number.isNaN(v) ? fallback : v;
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

async function fetchEnvelopeOrFallback<T>(
  apiUrl: string,
  fallbackUrl: string,
  wrapStatic: (raw: { type: string; features: unknown[] }) => T,
): Promise<Envelope<T>> {
  try {
    const r = await fetch(apiUrl);
    if (r.ok) return (await r.json()) as Envelope<T>;
    console.warn(`${apiUrl} → ${r.status}; using static fallback ${fallbackUrl}`);
  } catch (e) {
    console.warn(`${apiUrl} unreachable; using static fallback ${fallbackUrl}`, e);
  }
  const raw = await fetchJson<{ type: string; features: unknown[] }>(fallbackUrl);
  return { data: wrapStatic(raw), sources: [], generated_at: '' };
}

export async function loadData(): Promise<{ tracts: Tract[]; facilities: Facility[]; ltcHomes: LtcHome[]; hospitals: Hospital[] }> {
  const [commRes, facilRes, ltcRes, hospRes] = await Promise.all([
    fetchEnvelopeOrFallback<{ type: string; features: CommunityFeature[] }>(
      '/api/communities/features',
      '/data/brampton_full.geojson',
      raw => ({
        type: raw.type,
        features: (raw.features as Array<{ type: 'Feature'; geometry: CommunityFeature['geometry']; properties: Record<string, unknown> }>).map(f => {
          const p = f.properties ?? {};
          const ctuid = String(p.ctuid ?? p.CTUID ?? '');
          return {
            type: 'Feature',
            id: ctuid,
            geometry: f.geometry,
            properties: { ...p, ctuid } as unknown as CommunityFeature['properties'],
          } as CommunityFeature;
        }),
      }),
    ),
    fetchEnvelopeOrFallback<{ type: string; features: { geometry: { coordinates: number[] }; properties: Record<string, string> }[] }>(
      '/api/facilities',
      '/data/brampton_facilities.geojson',
      raw => ({ type: raw.type, features: raw.features as { geometry: { coordinates: number[] }; properties: Record<string, string> }[] }),
    ),
    fetchJson<{ type: string; features: LtcFeature[] }>('/data/ltc_homes.geojson').catch(() => ({ type: 'FeatureCollection', features: [] as LtcFeature[] })),
    fetchJson<{ type: string; features: HospitalFeature[] }>('/data/hospitals.geojson').catch(() => ({ type: 'FeatureCollection', features: [] as HospitalFeature[] })),
  ]);

  const facilities: Facility[] = (facilRes.data?.features ?? []).map(f => ({
    name: f.properties.name ?? '',
    address: f.properties.address ?? '',
    role: f.properties.role ?? '',
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));

  const ltcHomes: LtcHome[] = (ltcRes.features ?? []).map(f => ({
    name: f.properties.name,
    address: f.properties.address,
    beds: f.properties.beds ?? 0,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));

  const hospitals: Hospital[] = (hospRes.features ?? []).map(f => ({
    name: f.properties.name,
    address: f.properties.address,
    type: f.properties.type,
    emergency_24_7: f.properties.emergency_24_7,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));

  const tracts: Tract[] = (commRes.data?.features ?? []).map(f => {
    const p = f.properties;
    const [lat, lng] = centroid(f.geometry);
    const nearby = facilities.filter(fac => haversineKm(lat, lng, fac.lat, fac.lng) <= 2.5);
    const ltcInTract = ltcHomes.filter(home =>
      pointInTract(home.lng, home.lat, f.geometry as unknown as Tract['geometry'])
    );

    const hospitalsWithDist: NearbyHospital[] = hospitals
      .map(h => ({ ...h, distanceKm: haversineKm(lat, lng, h.lat, h.lng) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
    const nearestEr = hospitalsWithDist.find(h => h.emergency_24_7) ?? null;
    const hospitalsNearby = hospitalsWithDist.filter(h => h.distanceKm <= 8);

    return {
      ctuid: p.ctuid,
      neighbourhood: p.neighbourhood || p.ctuid,
      lat,
      lng,
      geometry: f.geometry as unknown as Tract['geometry'],
      population: num(p.population),
      median_income: num(p.median_income),
      pct_renters: num(p.pct_renters),
      pct_pre1980: num(p.pct_pre1980),
      pct_low_income: Math.min(num(p.pct_low_income), 1),
      pct_seniors_65plus: num(p.pct_seniors_65plus),
      pct_children_under5: num(p.pct_children_under5),
      pct_living_alone: num(p.pct_living_alone),
      pct_no_official_lang: num(p.pct_no_official_lang),
      pct_transit_commute: num(p.pct_transit_commute),
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
      aqhi: num(p.aqhi),
      aqhi_band: p.aqhi_band ?? '—',
      pm25: num(p.pm25),
      pm10: num(p.pm10),
      active_outages: num(p.active_outages),
      customers_affected: num(p.customers_affected),
      threshold_score_baseline: num(p.threshold_score_baseline),
      threshold_score_heatwave: num(p.threshold_score_heatwave),
      threshold_score_icestorm: num(p.threshold_score_icestorm),
      risk_level: p.risk_level ?? 'Moderate',
      shelterCount: nearby.length,
      shelterList: nearby.map(fac => fac.name),
      ltcCount: ltcInTract.length,
      ltcBeds: ltcInTract.reduce((sum, h) => sum + h.beds, 0),
      ltcList: ltcInTract,
      nearestErKm: nearestEr ? Math.round(nearestEr.distanceKm * 10) / 10 : null,
      nearestErName: nearestEr?.name ?? null,
      hospitalsNearby,
    };
  });

  return { tracts, facilities, ltcHomes, hospitals };
}
