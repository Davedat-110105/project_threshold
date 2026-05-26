import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../context';
import { getTier, TIER_COLORS, scoreFor } from '../utils';

const SHELTER_ICON = L.divIcon({
  html: '🏠',
  className: 'text-sm leading-none',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

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
          fillOpacity: isSel ? 0.85 : 0.55,
          color: isSel ? color : '#222222',
          weight: isSel ? 2 : 0.8,
        };
      },
      onEachFeature: (feat, lyr) => {
        const ctuid = feat.properties?.ctuid as string | undefined;
        const t = ctuid ? tractMap.get(ctuid) : undefined;
        if (!t) return;

        lyr.on('mouseover', () => {
          (lyr as L.Path).setStyle({ fillOpacity: 0.8 });
          const score = scoreFor(t, scenario);
          const tier = getTier(score);
          lyr.bindTooltip(
            `<strong style="color:#F5F5F5">${t.neighbourhood}</strong><br/><span style="color:#9CA3AF">${score.toFixed(1)} · ${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>`,
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
        const icon = L.divIcon({
          html: '<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid #fff"></div>',
          className: '',
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        L.marker([t.lat, t.lng], { icon })
          .bindTooltip(`Outage · ${t.customers_affected} customers`)
          .addTo(markersRef.current!);
      });
    }
  }, [tracts, facilities, showShelters, showOutages]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Toggle buttons */}
      <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1">
        <button
          onClick={() => setShowShelters(v => !v)}
          className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${showShelters ? 'bg-card border-accent text-accent' : 'bg-card border-border text-muted'}`}>
          🏠 Shelters
        </button>
        <button
          onClick={() => setShowOutages(v => !v)}
          className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${showOutages ? 'bg-card border-critical text-critical' : 'bg-card border-border text-muted'}`}>
          ⚡ Outages
        </button>
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
