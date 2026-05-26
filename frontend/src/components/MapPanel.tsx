import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Building2, HeartPulse, Hospital, RadioTower } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useApp } from '../context';
import { getTier, TIER_COLORS, TIER_LABELS, scoreFor } from '../utils';

const shelterHtml = `<div style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;background:#1C2336;border:1.5px solid #3B82F6;border-radius:4px;">
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
</div>`;

const SHELTER_ICON = L.divIcon({
  html: shelterHtml,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const OUTAGE_ICON = L.divIcon({
  html: '<div style="width:10px;height:10px;border-radius:50%;background:#F43F5E;border:2px solid rgba(244,63,94,0.3);box-shadow:0 0 6px #F43F5E88"></div>',
  className: '',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const ltcHtml = `<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:#1C2336;border:1.5px solid #EC4899;border-radius:50%;box-shadow:0 0 8px rgba(236,72,153,0.45);">
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
  </svg>
</div>`;

const LTC_ICON = L.divIcon({
  html: ltcHtml,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function hospitalHtml(color: string): string {
  return `<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:#1C2336;border:2px solid ${color};border-radius:6px;box-shadow:0 0 8px ${color}66;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 5v14"/><path d="M5 12h14"/>
    </svg>
  </div>`;
}

const HOSPITAL_ER_ICON = L.divIcon({
  html: hospitalHtml('#EF4444'),
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const HOSPITAL_URGENT_ICON = L.divIcon({
  html: hospitalHtml('#F59E0B'),
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function MapPanel() {
  const { tracts, facilities, ltcHomes, hospitals, selected, setSelected, scenario } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [showShelters, setShowShelters] = useState(true);
  const [showOutages, setShowOutages] = useState(true);
  const [showLtc, setShowLtc] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);

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
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Choropleth — redraw when scenario or selection changes
  useEffect(() => {
    if (!mapRef.current || tracts.length === 0) return;
    if (geoRef.current) { geoRef.current.remove(); geoRef.current = null; }

    const tractMap = new Map(tracts.map(t => [t.ctuid, t]));

    const geojson = {
      type: 'FeatureCollection' as const,
      features: tracts.map(t => ({
        type: 'Feature' as const,
        geometry: t.geometry as unknown as GeoJSON.Geometry,
        properties: { ctuid: t.ctuid },
      })),
    };

    const layer = L.geoJSON(geojson, {
      style: (feat) => {
        const t = feat?.properties?.ctuid ? tractMap.get(feat.properties.ctuid as string) : undefined;
        if (!t) return { fillOpacity: 0, weight: 0 };
        const score = scoreFor(t, scenario);
        const color = TIER_COLORS[getTier(score)];
        const isSel = selected?.ctuid === t.ctuid;
        return {
          fillColor: color,
          fillOpacity: isSel ? 0.85 : 0.5,
          color: isSel ? color : '#2D3A52',
          weight: isSel ? 2.5 : 1,
        };
      },
      onEachFeature: (feat, lyr) => {
        const ctuid = feat.properties?.ctuid as string | undefined;
        const t = ctuid ? tractMap.get(ctuid) : undefined;
        if (!t) return;

        lyr.on('mouseover', () => {
          (lyr as L.Path).setStyle({ fillOpacity: 0.75 });
          const score = scoreFor(t, scenario);
          const tier = getTier(score);
          lyr.bindTooltip(
            `<strong style="color:#E6EAF0">${t.neighbourhood}</strong><br/><span style="color:#7A8FA8">${score.toFixed(1)} · ${TIER_LABELS[tier]}</span>`,
            { sticky: true }
          ).openTooltip();
        });
        lyr.on('mouseout', () => layer.resetStyle(lyr as L.Path));
        lyr.on('click', () => setSelected(selected?.ctuid === t.ctuid ? null : t));
      },
    });

    layer.addTo(mapRef.current);
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
        L.marker([f.lat, f.lng], { icon: SHELTER_ICON })
          .bindTooltip(f.name)
          .addTo(markersRef.current!);
      });
    }

    if (showOutages) {
      tracts.filter(t => t.active_outages > 0).forEach(t => {
        L.marker([t.lat, t.lng], { icon: OUTAGE_ICON })
          .bindTooltip(`Outage · ${t.customers_affected} customers`)
          .addTo(markersRef.current!);
      });
    }

    if (showLtc) {
      ltcHomes.forEach(home => {
        L.marker([home.lat, home.lng], { icon: LTC_ICON })
          .bindTooltip(`<strong style="color:#E6EAF0">${home.name}</strong><br/><span style="color:#EC4899">${home.beds} beds</span><br/><span style="color:#7A8FA8">${home.address}</span>`)
          .addTo(markersRef.current!);
      });
    }

    if (showHospitals) {
      hospitals.forEach(h => {
        const icon = h.emergency_24_7 ? HOSPITAL_ER_ICON : HOSPITAL_URGENT_ICON;
        const tag = h.emergency_24_7 ? '24/7 ER' : 'Urgent Care';
        const color = h.emergency_24_7 ? '#EF4444' : '#F59E0B';
        L.marker([h.lat, h.lng], { icon })
          .bindTooltip(`<strong style="color:#E6EAF0">${h.name}</strong><br/><span style="color:${color}">${tag}</span><br/><span style="color:#7A8FA8">${h.address}</span>`)
          .addTo(markersRef.current!);
      });
    }
  }, [tracts, facilities, ltcHomes, hospitals, showShelters, showOutages, showLtc, showHospitals]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Toggle buttons */}
      <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1">
        <button
          onClick={() => setShowShelters(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-all duration-150 cursor-pointer
            ${showShelters ? 'bg-card border-accent/50 text-accent' : 'bg-card/80 border-border text-muted hover:text-primary'}`}>
          <Building2 size={11} />Shelters
        </button>
        <button
          onClick={() => setShowOutages(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-all duration-150 cursor-pointer
            ${showOutages ? 'bg-card border-critical/50 text-critical' : 'bg-card/80 border-border text-muted hover:text-primary'}`}>
          <RadioTower size={11} />Outages
        </button>
        <button
          onClick={() => setShowLtc(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-all duration-150 cursor-pointer
            ${showLtc ? 'bg-card text-[#EC4899] border-[#EC4899]/50' : 'bg-card/80 border-border text-muted hover:text-primary'}`}>
          <HeartPulse size={11} />LTC Homes
        </button>
        <button
          onClick={() => setShowHospitals(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-all duration-150 cursor-pointer
            ${showHospitals ? 'bg-card text-[#EF4444] border-[#EF4444]/50' : 'bg-card/80 border-border text-muted hover:text-primary'}`}>
          <Hospital size={11} />Hospitals
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2.5 text-xs space-y-1">
        {(['low', 'moderate', 'high', 'critical'] as const).map(tier => (
          <div key={tier} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: TIER_COLORS[tier] }} />
            <span className="text-muted capitalize">{tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
