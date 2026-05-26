export type Scenario = 'Baseline' | 'Heatwave' | 'Ice Storm';
export type Tier = 'low' | 'moderate' | 'high' | 'critical';
export type View = 'Map' | 'Triage';

export interface Tract {
  ctuid: string;
  neighbourhood: string;
  lat: number;
  lng: number;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][];
  };
  population: number;
  median_income: number;
  pct_renters: number;
  pct_pre1980: number;
  pct_low_income: number;
  pct_seniors_65plus: number;
  pct_children_under5: number;
  pct_living_alone: number;
  pct_no_official_lang: number;
  pct_transit_commute: number;
  cisv_score: number;
  cisv_dim1: number;
  cisv_dim2: number;
  cisv_dim3: number;
  cisv_dim4: number;
  cisv_quintile: number;
  cisr_score: number;
  cisr_quintile: number;
  temperature_c: number;
  humidex: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  wind_gusts_kmh: number;
  weather_code: number;
  aqhi: number;
  aqhi_band: string;
  pm25: number;
  pm10: number;
  active_outages: number;
  customers_affected: number;
  threshold_score_baseline: number;
  threshold_score_heatwave: number;
  threshold_score_icestorm: number;
  risk_level: string;
  shelterCount: number;
  shelterList: string[];
  ltcCount: number;
  ltcBeds: number;
  ltcList: LtcHome[];
  nearestErKm: number | null;
  nearestErName: string | null;
  hospitalsNearby: NearbyHospital[];
}

export interface Facility {
  name: string;
  address: string;
  role: string;
  lat: number;
  lng: number;
}

export interface LtcHome {
  name: string;
  address: string;
  beds: number;
  lat: number;
  lng: number;
}

export interface Hospital {
  name: string;
  address: string;
  type: string;
  emergency_24_7: boolean;
  lat: number;
  lng: number;
}

export interface NearbyHospital extends Hospital {
  distanceKm: number;
}
