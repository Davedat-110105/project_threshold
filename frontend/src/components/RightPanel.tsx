import React, { useState, useEffect } from 'react';
import {
  Map, Thermometer, Wind, CloudRain, AlertTriangle, Building2,
  TrendingDown, MessageSquare, Send,
  Loader2, Sparkles, CheckCircle2, DollarSign, ChevronUp, ChevronDown,
  HeartPulse, Users, Baby, Languages, Bus, Hospital, CloudFog,
} from 'lucide-react';
import { useApp } from '../context';
import { getTier, TIER_COLORS, TIER_LABELS, scoreFor, formatIncome, formatPct, weatherLabel } from '../utils';

const SCENARIO_SLUG: Record<string, string> = {
  'Baseline': 'baseline',
  'Heatwave': 'heatwave',
  'Ice Storm': 'icestorm',
};

interface RecInput { name: string; value: number; units: string | null }
interface RecCard {
  id: string;
  action: string;
  why: string;
  actor: string;
  confidence: string;
  projected_impact: string | null;
  cost_estimate_cad: number | null;
  inputs: RecInput[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border/60">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-4 py-2.5 hover:bg-hover/50 transition-colors cursor-pointer">
        <span className="text-xs font-semibold text-muted uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp size={12} className="text-muted/50" /> : <ChevronDown size={12} className="text-muted/50" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

function aqhiColor(score: number): string {
  if (score <= 3) return '#22C55E';   // Low
  if (score <= 6) return '#F59E0B';   // Moderate
  if (score <= 10) return '#EF4444';  // High
  return '#7F1D1D';                    // Very High
}

function aqhiDisplay(score: number): string {
  if (score >= 10.5) return '10+';
  return String(Math.round(score));
}

function Bar({ label, value, max = 1, color = '#3B82F6' }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.min(Math.max(value / max, 0), 1) * 100;
  const display = max === 1 ? `${(value * 100).toFixed(0)}%` : value.toFixed(2);
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{display}</span>
      </div>
      <div className="h-1.5 rounded-full bg-hover">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function RightPanel() {
  const { selected, scenario } = useApp();
  const [reportText, setReportText] = useState('');
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [recs, setRecs] = useState<RecCard[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    setBriefing(null);
    setBriefingLoading(false);
    if (!selected) { setRecs([]); return; }
    const slug = SCENARIO_SLUG[scenario] ?? 'baseline';
    setRecsLoading(true);
    fetch(`/api/recommendations?ct=${selected.ctuid}&scenario=${slug}`)
      .then(r => r.json())
      .then(d => setRecs(d.data ?? []))
      .catch(() => setRecs([]))
      .finally(() => setRecsLoading(false));
  }, [selected?.ctuid, scenario]);

  async function fetchBriefing() {
    if (!selected) return;
    setBriefingLoading(true);
    try {
      const slug = SCENARIO_SLUG[scenario] ?? 'baseline';
      const r = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ctuid: selected.ctuid, scenario: slug }),
      });
      const d = await r.json();
      setBriefing(d.data?.briefing ?? 'No briefing returned.');
    } catch {
      setBriefing('Briefing unavailable — check backend connection.');
    } finally {
      setBriefingLoading(false);
    }
  }

  if (!selected) {
    return (
      <aside className="w-80 bg-panel border-l border-border flex flex-col items-center justify-center text-center p-6 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center mb-3">
          <Map size={22} className="text-muted" />
        </div>
        <div className="text-sm font-medium text-primary mb-1">Select a neighbourhood</div>
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
      <div className="px-4 py-3.5 border-b border-border/60">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-2">
            <div className="font-semibold text-sm text-primary leading-tight">{selected.neighbourhood}</div>
            <div className="text-xs text-muted font-mono mt-0.5">CT {selected.ctuid}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>{score.toFixed(0)}</div>
            <div className="text-xs font-semibold mt-0.5 px-1.5 py-0.5 rounded-md" style={{ color, background: `${color}1A` }}>
              {TIER_LABELS[tier]} Risk
            </div>
          </div>
        </div>
        <div className="mt-2.5 flex gap-1.5 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-md border border-orange/40 text-orange bg-orange/10 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange inline-block" />Alectra
          </span>
          {selected.active_outages > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-md border border-critical/40 text-critical bg-critical/10 flex items-center gap-1 animate-pulse">
              <AlertTriangle size={10} />
              {selected.active_outages} outage{selected.active_outages > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Live weather */}
      <Section title="Live Weather">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {([
            ['Temperature', `${selected.temperature_c.toFixed(1)}°C`, <Thermometer size={11} />],
            ['Humidex', `${selected.humidex.toFixed(1)}°C`, <Thermometer size={11} />],
            ['Wind', `${selected.wind_speed_kmh.toFixed(0)} km/h`, <Wind size={11} />],
            ['Conditions', weatherLabel(selected.weather_code), <CloudRain size={11} />],
          ] as [string, string, React.ReactNode][]).map(([k, v, icon]) => (
            <div key={k}>
              <div className="text-muted flex items-center gap-1">{icon}{k}</div>
              <div className="font-mono text-primary mt-0.5">{v}</div>
            </div>
          ))}
        </div>
        {selected.humidex >= 38 && (
          <div className="mt-2.5 text-xs px-2.5 py-1.5 rounded-lg bg-critical/10 text-critical border border-critical/20 flex items-center gap-1.5">
            <AlertTriangle size={11} />
            <span>Heat stress risk — humidex ≥ 38°C</span>
          </div>
        )}
      </Section>

      {/* Air Quality */}
      <Section title="Air Quality (AQHI)">
        {selected.aqhi == null || selected.aqhi === 0 ? (
          <div className="text-xs text-muted">Air quality data not available.</div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="text-xs text-muted flex items-center gap-1 mb-1">
                  <CloudFog size={11} />Health Risk
                </div>
                <div className="text-sm font-semibold leading-tight" style={{ color: aqhiColor(selected.aqhi) }}>
                  {selected.aqhi_band} Risk
                </div>
                <div className="text-xs text-muted mt-0.5">Environment Canada scale</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono tabular-nums leading-none" style={{ color: aqhiColor(selected.aqhi) }}>
                  {aqhiDisplay(selected.aqhi)}
                </div>
                <div className="text-xs text-muted mt-1">/ 10+</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card rounded-lg p-2 border border-border/50">
                <div className="text-xs text-muted">PM2.5</div>
                <div className="text-xs font-mono text-primary tabular-nums">{selected.pm25?.toFixed(1)} µg/m³</div>
              </div>
              <div className="bg-card rounded-lg p-2 border border-border/50">
                <div className="text-xs text-muted">PM10</div>
                <div className="text-xs font-mono text-primary tabular-nums">{selected.pm10?.toFixed(1)} µg/m³</div>
              </div>
            </div>

            {selected.aqhi >= 4 && selected.pct_seniors_65plus >= 0.15 && (
              <div className="mt-2 text-xs px-2.5 py-1.5 rounded-lg border flex items-start gap-1.5"
                style={{ background: `${aqhiColor(selected.aqhi)}1A`, color: aqhiColor(selected.aqhi), borderColor: `${aqhiColor(selected.aqhi)}33` }}>
                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                <span>AQHI {aqhiDisplay(selected.aqhi)} + {formatPct(selected.pct_seniors_65plus)} seniors — recommend stay-indoors advisory.</span>
              </div>
            )}
            {selected.aqhi >= 7 && (
              <div className="mt-1 text-xs px-2.5 py-1.5 rounded-lg bg-critical/10 text-critical border border-critical/20 flex items-start gap-1.5">
                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                <span>High-risk air — close windows, limit outdoor exposure for all residents.</span>
              </div>
            )}
          </>
        )}
      </Section>

      {/* Vulnerability breakdown */}
      <Section title="Vulnerability Breakdown">
        <Bar label="Social Vulnerability (CISV)" value={Math.max(selected.cisv_score, 0)} max={1.2} color={color} />
        <Bar label="Renter Households" value={selected.pct_renters} color="#F97316" />
        <Bar label="Pre-1980 Housing" value={selected.pct_pre1980} color="#F59E0B" />
        <Bar label="Low Income Share" value={selected.pct_low_income} color="#F43F5E" />
        <Bar label="Resilience (CISR) ↑ better" value={Math.max(selected.cisr_score, 0)} max={2} color="#34D399" />
      </Section>

      {/* Population Profile */}
      <Section title="Population Profile">
        <div className="text-xs text-muted mb-2">Who actually lives here — drives heatwave & emergency-response risk.</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-card rounded-lg p-2.5 border border-border/50">
            <div className="text-xs text-muted flex items-center gap-1 mb-1"><Users size={11} />Seniors 65+</div>
            <div className="text-sm font-mono text-primary tabular-nums">{formatPct(selected.pct_seniors_65plus)}</div>
          </div>
          <div className="bg-card rounded-lg p-2.5 border border-border/50">
            <div className="text-xs text-muted flex items-center gap-1 mb-1"><Baby size={11} />Children &lt; 5</div>
            <div className="text-sm font-mono text-primary tabular-nums">{formatPct(selected.pct_children_under5)}</div>
          </div>
          <div className="bg-card rounded-lg p-2.5 border border-border/50">
            <div className="text-xs text-muted flex items-center gap-1 mb-1"><Users size={11} />Live Alone</div>
            <div className="text-sm font-mono text-primary tabular-nums">{formatPct(selected.pct_living_alone)}</div>
          </div>
          <div className="bg-card rounded-lg p-2.5 border border-border/50">
            <div className="text-xs text-muted flex items-center gap-1 mb-1"><Languages size={11} />No EN/FR</div>
            <div className="text-sm font-mono text-primary tabular-nums">{formatPct(selected.pct_no_official_lang)}</div>
          </div>
          <div className="bg-card rounded-lg p-2.5 border border-border/50 col-span-2">
            <div className="text-xs text-muted flex items-center gap-1 mb-1"><Bus size={11} />Commute by Transit</div>
            <div className="text-sm font-mono text-primary tabular-nums">{formatPct(selected.pct_transit_commute)}</div>
          </div>
        </div>
        {selected.pct_seniors_65plus >= 0.20 && (
          <div className="mt-1 text-xs px-2.5 py-1.5 rounded-lg bg-critical/10 text-critical border border-critical/20 flex items-start gap-1.5">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            <span>Senior-heavy neighbourhood — heatwave & cold-emergency priority.</span>
          </div>
        )}
        {selected.pct_no_official_lang >= 0.05 && (
          <div className="mt-1 text-xs px-2.5 py-1.5 rounded-lg bg-orange/10 text-orange border border-orange/20 flex items-start gap-1.5">
            <Languages size={11} className="mt-0.5 shrink-0" />
            <span>English-only emergency alerts will miss part of this community.</span>
          </div>
        )}
      </Section>

      {/* CISV dimensions */}
      <Section title="Social Vulnerability (CISV)">
        <div className="text-xs text-muted mb-2.5">
          Quintile <span className="text-primary font-semibold">{selected.cisv_quintile}/5</span> nationally
          <span className="text-muted/60 ml-1">(5 = most vulnerable)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['Racialized & Immigration', selected.cisv_dim1],
            ['Income & Labour', selected.cisv_dim2],
            ['Education & Indigenous', selected.cisv_dim3],
            ['Dwelling Conditions', selected.cisv_dim4],
          ] as [string, number][]).map(([label, val]) => {
            const w = Math.min(Math.abs(val) / 1.5, 1) * 100;
            return (
              <div key={label} className="bg-card rounded-lg p-2.5 border border-border/50">
                <div className="text-xs text-muted leading-tight mb-1.5">{label}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-primary tabular-nums">{val.toFixed(2)}</span>
                  <div className="h-1.5 rounded-full bg-hover flex-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${w}%`, background: val >= 0 ? '#F97316' : '#34D399' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Income */}
      <Section title="Income & Energy Poverty">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
          <div>
            <div className="text-muted flex items-center gap-1"><TrendingDown size={10} />Median Income</div>
            <div className="font-mono text-primary mt-0.5">{formatIncome(selected.median_income)}</div>
          </div>
          <div>
            <div className="text-muted">vs. City ($88k)</div>
            <div className={`font-mono mt-0.5 ${selected.median_income < cityMedian ? 'text-critical' : 'text-low'}`}>
              {selected.median_income < cityMedian
                ? <TrendingDown size={12} className="inline mr-0.5" />
                : <ChevronUp size={12} className="inline mr-0.5" />}
              {formatPct(Math.abs(selected.median_income - cityMedian) / cityMedian)}
            </div>
          </div>
          <div>
            <div className="text-muted">Est. Energy % Income</div>
            <div className={`font-mono mt-0.5 ${Number(energyPct) > 6 ? 'text-critical' : 'text-primary'}`}>~{energyPct}%</div>
          </div>
          <div>
            <div className="text-muted">Pre-1980 Homes</div>
            <div className="font-mono text-primary mt-0.5">{formatPct(selected.pct_pre1980)}</div>
          </div>
        </div>
      </Section>

      {/* Shelters */}
      <Section title="Cooling & Warming Centres">
        {selected.shelterCount === 0 ? (
          <div className="text-xs text-critical flex gap-1.5 items-start bg-critical/10 border border-critical/20 rounded-lg px-2.5 py-2">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            <span>No cooling/warming centre within 2.5 km</span>
          </div>
        ) : (
          <>
            <div className="text-xs text-muted mb-1.5">{selected.shelterCount} within 2.5 km</div>
            {selected.shelterList.slice(0, 3).map(name => (
              <div key={name} className="text-xs text-primary py-1.5 border-b border-border/40 last:border-0 flex items-center gap-2">
                <Building2 size={11} className="text-accent shrink-0" />{name}
              </div>
            ))}
            {selected.shelterList.length > 3 && (
              <div className="text-xs text-muted mt-1">+{selected.shelterList.length - 3} more</div>
            )}
          </>
        )}
      </Section>

      {/* Long-Term Care Homes */}
      <Section title="Long-Term Care Homes">
        {selected.ltcCount === 0 ? (
          <div className="text-xs text-muted">No long-term care homes located inside this census tract.</div>
        ) : (
          <>
            <div className="text-xs mb-2 flex items-center gap-1.5 flex-wrap">
              <HeartPulse size={11} className="text-[#EC4899]" />
              <span className="text-primary font-semibold">{selected.ltcCount} home{selected.ltcCount > 1 ? 's' : ''}</span>
              <span className="text-muted">·</span>
              <span className="text-primary font-mono tabular-nums">{selected.ltcBeds}</span>
              <span className="text-muted">licensed beds</span>
            </div>
            {selected.ltcList.map(home => (
              <div key={home.name} className="py-1.5 border-b border-border/40 last:border-0">
                <div className="text-xs text-primary flex items-center gap-2">
                  <HeartPulse size={10} className="text-[#EC4899] shrink-0" />
                  <span className="flex-1 leading-tight">{home.name}</span>
                  <span className="text-muted font-mono tabular-nums shrink-0">{home.beds} beds</span>
                </div>
                <div className="text-xs text-muted/70 ml-4 mt-0.5">{home.address}</div>
              </div>
            ))}
            <div className="mt-2 text-xs px-2.5 py-1.5 rounded-lg bg-[#EC4899]/10 text-[#EC4899] border border-[#EC4899]/20 flex items-start gap-1.5">
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              <span>Concentrated frail-senior population — top priority for emergency dispatch.</span>
            </div>
          </>
        )}
      </Section>

      {/* Healthcare Access */}
      <Section title="Healthcare Access">
        {selected.nearestErKm == null ? (
          <div className="text-xs text-muted">No hospital data available.</div>
        ) : (
          <>
            <div className="bg-card rounded-lg p-2.5 border border-border/50 mb-2">
              <div className="text-xs text-muted flex items-center gap-1 mb-1">
                <Hospital size={11} className="text-[#EF4444]" />Nearest 24/7 ER
              </div>
              <div className="text-sm text-primary leading-tight">{selected.nearestErName}</div>
              <div className="text-xs font-mono text-muted mt-1 tabular-nums">{selected.nearestErKm.toFixed(1)} km away</div>
            </div>

            {selected.hospitalsNearby.length > 1 && (
              <>
                <div className="text-xs text-muted mb-1.5">All hospitals within 8 km:</div>
                {selected.hospitalsNearby.map(h => {
                  const color = h.emergency_24_7 ? '#EF4444' : '#F59E0B';
                  const tag = h.emergency_24_7 ? 'ER' : 'Urgent Care';
                  return (
                    <div key={h.name} className="py-1.5 border-b border-border/40 last:border-0">
                      <div className="text-xs text-primary flex items-center gap-2">
                        <Hospital size={10} style={{ color }} className="shrink-0" />
                        <span className="flex-1 leading-tight">{h.name}</span>
                        <span className="text-muted font-mono tabular-nums shrink-0">{h.distanceKm.toFixed(1)} km</span>
                      </div>
                      <div className="text-xs ml-4 mt-0.5" style={{ color }}>{tag}</div>
                    </div>
                  );
                })}
              </>
            )}

            {selected.nearestErKm >= 5 && (
              <div className="mt-2 text-xs px-2.5 py-1.5 rounded-lg bg-critical/10 text-critical border border-critical/20 flex items-start gap-1.5">
                <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                <span>Nearest ER is {selected.nearestErKm.toFixed(1)} km away — extended ambulance time during emergencies.</span>
              </div>
            )}
          </>
        )}
      </Section>

      {/* Community reports */}
      <Section title="Community Reports">
        <div className="text-xs text-muted mb-2 flex items-center gap-1">
          <MessageSquare size={11} />No community reports yet for this area.
        </div>
        <textarea
          value={reportText}
          onChange={e => setReportText(e.target.value)}
          placeholder="Report a condition in this area…"
          rows={2}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-primary resize-none focus:outline-none focus:border-accent/60 transition-colors"
        />
        <button
          onClick={() => setReportText('')}
          disabled={!reportText.trim()}
          className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-accent text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors cursor-pointer">
          <Send size={10} />Submit
        </button>
      </Section>

      {/* AI Briefing */}
      <Section title="AI Briefing">
        {briefing ? (
          <div className="space-y-2">
            <p className="text-xs text-primary leading-relaxed whitespace-pre-wrap">{briefing}</p>
            <button onClick={fetchBriefing} disabled={briefingLoading}
              className="text-xs text-muted hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
              <Loader2 size={10} className={briefingLoading ? 'animate-spin' : 'hidden'} />
              Regenerate
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted">AI-generated operational briefing for this neighbourhood under the {scenario} scenario.</p>
            <button onClick={fetchBriefing} disabled={briefingLoading}
              className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg border border-accent/40 text-accent bg-accent/10 hover:bg-accent/20 hover:border-accent/60 transition-all duration-150 cursor-pointer disabled:opacity-50">
              {briefingLoading
                ? <><Loader2 size={11} className="animate-spin" />Generating briefing…</>
                : <><Sparkles size={11} />Generate AI Briefing</>}
            </button>
          </div>
        )}
      </Section>

      {/* Recommendations */}
      <Section title="Recommended Actions">
        {recsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted py-2">
            <Loader2 size={11} className="animate-spin" />Loading recommendations…
          </div>
        ) : recs.length === 0 ? (
          <div className="text-xs text-muted py-1">No rule-based actions triggered for current conditions.</div>
        ) : (
          <div className="space-y-3">
            {recs.map(card => (
              <div key={card.id} className="bg-card rounded-lg border border-border/60 p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-primary leading-tight">{card.action}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 font-medium
                    ${card.confidence === 'High' ? 'bg-low/15 text-low' : card.confidence === 'Medium' ? 'bg-moderate/15 text-moderate' : 'bg-muted/15 text-muted'}`}>
                    {card.confidence}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-2">{card.why}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-hover text-muted border border-border/40">
                    {card.actor}
                  </span>
                  {card.projected_impact && (
                    <span className="px-2 py-0.5 rounded bg-low/10 text-low border border-low/20 flex items-center gap-1">
                      <CheckCircle2 size={9} />{card.projected_impact}
                    </span>
                  )}
                  {card.cost_estimate_cad != null && (
                    <span className="px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
                      <DollarSign size={9} />CAD {card.cost_estimate_cad.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </aside>
  );
}
