import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Shipment } from '../../types';
import { useShipmentStore } from '../../store/useShipmentStore';
import { RiskBadge } from '../ui/RiskBadge';
import { StatusChip } from '../ui/StatusChip';
import { useThemeStore } from '../../store/useThemeStore';

// ─── Port coordinate registry ─────────────────────────────────────────────────
const PORT_COORDS: Record<string, [number, number]> = {
  Mumbai:      [19.076,  72.877],
  Shanghai:    [31.230, 121.473],
  Singapore:   [1.290,  103.850],
  Dubai:       [25.204,  55.270],
  Shenzhen:    [22.543, 114.058],
  Rotterdam:   [51.920,   4.480],
  Hamburg:     [53.550,   9.993],
  Antwerp:     [51.221,   4.402],
  'Los Angeles':[33.720,-118.270],
  'Port Said': [31.260,  32.300],
  'Cape Town': [-33.924,  18.424],
  Colombo:     [6.927,   79.861],
  Jeddah:      [21.485,  39.172],
  Suez:        [29.966,  32.549],
  Seattle:     [47.608, -122.335],
};

// ─── Risk colour helpers ───────────────────────────────────────────────────────
const RISK_COLOR: Record<string, string> = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

// ─── Custom SVG DivIcon factories ─────────────────────────────────────────────
function vesselIcon(riskLevel: string, isSelected: boolean, isAnomaly: boolean): L.DivIcon {
  const color = RISK_COLOR[riskLevel] || '#94a3b8';
  const isAlert = riskLevel === 'critical' || riskLevel === 'high' || isAnomaly;
  const pulse = isAlert;
  const size = isSelected ? 22 : 16;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size + 16}" height="${size + 16}" viewBox="0 0 ${size + 16} ${size + 16}">
      ${pulse ? `
        <circle cx="${(size + 16) / 2}" cy="${(size + 16) / 2}" r="${size / 2 + 4}" fill="none" stroke="#ef4444" stroke-width="1.5" opacity="0.8">
          <animate attributeName="r" from="${size / 2 + 2}" to="${size / 2 + 12}" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.8" to="0" dur="1s" repeatCount="indefinite"/>
        </circle>
        <circle cx="${(size + 16) / 2}" cy="${(size + 16) / 2}" r="${size / 2 + 4}" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.4">
          <animate attributeName="r" from="${size / 2 + 2}" to="${size / 2 + 16}" dur="1s" begin="0.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="1s" begin="0.2s" repeatCount="indefinite"/>
        </circle>
      ` : ''}
      ${isSelected ? `<circle cx="${(size + 16) / 2}" cy="${(size + 16) / 2}" r="${size / 2 + 5}" fill="none" stroke="#22d3ee" stroke-width="2"/>` : ''}
      <circle cx="${(size + 16) / 2}" cy="${(size + 16) / 2}" r="${size / 2}" fill="${color}" opacity="0.92"/>
      <circle cx="${(size + 16) / 2}" cy="${(size + 16) / 2}" r="${size / 4}" fill="white" opacity="0.9"/>
      ${isAnomaly ? `<circle cx="${(size + 16) / 2 + size / 3}" cy="${(size + 16) / 2 - size / 3}" r="3.5" fill="#f59e0b"/>` : ''}
    </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize:   [size + 16, size + 16],
    iconAnchor: [(size + 16) / 2, (size + 16) / 2],
  });
}

function portIcon(type: 'origin' | 'destination'): L.DivIcon {
  const color = type === 'origin' ? '#22d3ee' : '#a78bfa';
  const label = type === 'origin' ? 'O' : 'D';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="34" viewBox="0 0 28 34">
      <path d="M14 0 C6.268 0 0 6.268 0 14 C0 24.5 14 34 14 34 C14 34 28 24.5 28 14 C28 6.268 21.732 0 14 0Z"
        fill="${color}" opacity="0.9"/>
      <circle cx="14" cy="14" r="8" fill="rgba(0,0,0,0.4)"/>
      <text x="14" y="18.5" text-anchor="middle" font-size="10" font-weight="bold" fill="white" font-family="Inter,sans-serif">${label}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize:   [28, 34],
    iconAnchor: [14, 34],
    popupAnchor:[0, -34],
  });
}

// ─── Curved arc path between two lat/lng points ───────────────────────────────
function buildArcLatLngs(
  from: [number, number],
  to:   [number, number],
  steps = 60,
  curvature = 0.25,
): L.LatLng[] {
  const points: L.LatLng[] = [];
  const midLat = (from[0] + to[0]) / 2 + curvature * Math.abs(to[1] - from[1]);
  const midLng = (from[1] + to[1]) / 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * midLat + t * t * to[0];
    const lng = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * midLng + t * t * to[1];
    points.push(L.latLng(lat, lng));
  }
  return points;
}

// ─── Map layer manager (imperative Leaflet, no react-leaflet) ─────────────────
class MapLayerManager {
  private map: L.Map;
  private vesselMarkers: Map<string, L.Marker> = new Map();
  private originMarkers: Map<string, L.Marker> = new Map();
  private destMarkers:   Map<string, L.Marker> = new Map();
  private routeLines:    Map<string, L.Polyline[]> = new Map();
  private progressLines: Map<string, L.Polyline> = new Map();
  private onSelect: (s: Shipment) => void;

  constructor(map: L.Map, onSelect: (s: Shipment) => void) {
    this.map = map;
    this.onSelect = onSelect;
  }

  updateShipments(shipments: Shipment[], selectedId: string | null) {
    const seen = new Set<string>();

    shipments.forEach((s) => {
      seen.add(s.id);
      const isSelected = s.id === selectedId;
      const origCoords = PORT_COORDS[s.origin];
      const destCoords = PORT_COORDS[s.destination];
      const vesselPos: [number, number] = [s.lat, s.lng];

      // ── Vessel marker ──────────────────────────────────────────────────────
      const icon = vesselIcon(s.risk_level, isSelected, s.is_anomaly);
      if (this.vesselMarkers.has(s.id)) {
        const m = this.vesselMarkers.get(s.id)!;
        m.setLatLng(vesselPos);
        m.setIcon(icon);
      } else {
        const m = L.marker(vesselPos, { icon, zIndexOffset: isSelected ? 1000 : 0 })
          .addTo(this.map)
          .on('click', () => this.onSelect(s));
        m.bindTooltip(
          `<div style="background:var(--bg-primary);color:var(--text-primary);border:1px solid var(--glass-border);border-radius:8px;padding:8px 10px;font-family:Inter,sans-serif;min-width:160px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
            <div style="font-size:11px;font-weight:700;color:#06b6d4;margin-bottom:4px">${s.id}</div>
            <div style="font-size:10px;opacity:0.7">${s.origin} → ${s.destination}</div>
            <div style="font-size:10px;opacity:0.7;margin-top:2px">${s.carrier} · ${s.cargo_type}</div>
            <div style="display:flex;gap:8px;margin-top:6px;font-size:10px">
              <span style="color:${RISK_COLOR[s.risk_level]};font-weight:600">Risk ${s.risk_score.toFixed(0)}</span>
              <span style="color:#64748b">ETA ${s.eta_days ?? '?'}d</span>
              <span style="color:#64748b">${s.speed_kmh} km/h</span>
            </div>
          </div>`,
          { permanent: false, direction: 'top', offset: [0, -10], opacity: 1, className: 'leaflet-tooltip-custom' }
        );
        this.vesselMarkers.set(s.id, m);
      }

      // ── Origin port marker ─────────────────────────────────────────────────
      if (origCoords && !this.originMarkers.has(s.origin)) {
        const m = L.marker(origCoords, { icon: portIcon('origin'), zIndexOffset: 500 })
          .addTo(this.map);
        m.bindTooltip(
          `<div style="background:var(--bg-primary);color:var(--text-primary);border:1px solid rgba(34,211,238,0.3);border-radius:6px;padding:6px 10px;font-family:Inter,sans-serif;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
            <div style="font-size:10px;font-weight:700;color:#06b6d4">ORIGIN</div>
            <div style="font-size:11px;font-weight:600">${s.origin}</div>
          </div>`,
          { permanent: false, direction: 'top', offset: [0, -36], opacity: 1, className: 'leaflet-tooltip-custom' }
        );
        this.originMarkers.set(s.origin, m);
      }

      // ── Destination port marker ────────────────────────────────────────────
      if (destCoords && !this.destMarkers.has(s.destination)) {
        const m = L.marker(destCoords, { icon: portIcon('destination'), zIndexOffset: 500 })
          .addTo(this.map);
        m.bindTooltip(
          `<div style="background:var(--bg-primary);color:var(--text-primary);border:1px solid rgba(167,139,250,0.3);border-radius:6px;padding:6px 10px;font-family:Inter,sans-serif;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
            <div style="font-size:10px;font-weight:700;color:#8b5cf6">DESTINATION</div>
            <div style="font-size:11px;font-weight:600">${s.destination}</div>
          </div>`,
          { permanent: false, direction: 'top', offset: [0, -36], opacity: 1, className: 'leaflet-tooltip-custom' }
        );
        this.destMarkers.set(s.destination, m);
      }

      // ── Full route arc (origin → destination) ─────────────────────────────
      if (origCoords && destCoords && !this.routeLines.has(s.id)) {
        const arcColor = RISK_COLOR[s.risk_level];
        const fullArc = buildArcLatLngs(origCoords, destCoords, 80, 0.18);
        const fullLine = L.polyline(fullArc, {
          color: arcColor,
          weight: 1.5,
          opacity: 0.25,
          dashArray: '6 8',
          smoothFactor: 1,
        }).addTo(this.map);

        // Progress arc (origin → vessel)
        const progressArc = buildArcLatLngs(origCoords, vesselPos, 40, 0.12);
        const progressLine = L.polyline(progressArc, {
          color: arcColor,
          weight: 2.5,
          opacity: 0.7,
          smoothFactor: 1,
        }).addTo(this.map);

        this.routeLines.set(s.id, [fullLine, progressLine]);
        this.progressLines.set(s.id, progressLine);
      } else if (origCoords && this.progressLines.has(s.id)) {
        // Update progress arc
        const progressArc = buildArcLatLngs(origCoords, vesselPos, 40, 0.12);
        this.progressLines.get(s.id)!.setLatLngs(progressArc);
      }
    });

    // Remove stale markers
    this.vesselMarkers.forEach((m, id) => {
      if (!seen.has(id)) {
        m.remove();
        this.vesselMarkers.delete(id);
        this.routeLines.get(id)?.forEach((l) => l.remove());
        this.routeLines.delete(id);
        this.progressLines.delete(id);
      }
    });
  }

  destroy() {
    this.vesselMarkers.forEach((m) => m.remove());
    this.originMarkers.forEach((m) => m.remove());
    this.destMarkers.forEach((m) => m.remove());
    this.routeLines.forEach((ls) => ls.forEach((l) => l.remove()));
  }
}

// ─── Main ShipmentMap component ───────────────────────────────────────────────
export function ShipmentMap() {
  const { shipments, selectedShipment, selectShipment } = useShipmentStore();
  const { theme } = useThemeStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const managerRef   = useRef<MapLayerManager | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:          [20, 0],
      zoom:            2,
      minZoom:         2,
      maxZoom:         19,
      maxBounds:       [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0,
      zoomControl:     false,
      attributionControl: false,
    });

    // Initial tile layer based on current theme
    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '© OpenStreetMap © CARTO',
    }).addTo(map);

    // Subtle attribution
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('<span style="color:#334155;font-size:9px">© OpenStreetMap © CARTO</span>')
      .addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapRef.current   = map;
    managerRef.current = new MapLayerManager(map, selectShipment);

    return () => {
      managerRef.current?.destroy();
      map.remove();
      mapRef.current    = null;
      managerRef.current = null;
    };
  }, []);

  // Update markers whenever shipments or selection changes
  useEffect(() => {
    if (!managerRef.current) return;
    managerRef.current.updateShipments(shipments, selectedShipment?.id ?? null);
  }, [shipments, selectedShipment]);

  // Update map tiles when theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [theme]);

  // Pan to selected shipment
  useEffect(() => {
    if (!mapRef.current || !selectedShipment) return;
    mapRef.current.flyTo([selectedShipment.lat, selectedShipment.lng], 4, {
      animate: true,
      duration: 1.2,
    });
  }, [selectedShipment?.id]);

  return (
    <div className="relative w-full h-full">
      {/* Leaflet container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-3 bg-white/80 dark:bg-[#0a1628]/88 border border-black/5 dark:border-white/10 rounded-lg px-3 py-2 backdrop-blur-md shadow-lg transition-colors">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#06b6d4] dark:bg-[#22d3ee]" />
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Origin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6] dark:bg-[#a78bfa]" />
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Destination</span>
        </div>
        <div className="w-px h-3 bg-black/10 dark:bg-white/10" />
        {[
          { color: '#10b981', label: 'Low' },
          { color: '#f59e0b', label: 'Medium' },
          { color: '#f97316', label: 'High' },
          { color: '#ef4444', label: 'Critical' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Vessel count */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/80 dark:bg-[#0a1628]/88 border border-black/5 dark:border-white/10 rounded-lg px-3 py-1.5 backdrop-blur-md flex items-center gap-2 shadow-lg transition-colors">
        <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
        <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">{shipments.length} active vessels</span>
      </div>
    </div>
  );
}

// ─── Shipment detail drawer (unchanged) ───────────────────────────────────────
export function ShipmentDetailDrawer() {
  const { selectedShipment, selectShipment } = useShipmentStore();

  if (!selectedShipment) return null;
  const s = selectedShipment;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute right-0 top-0 h-full w-80 bg-white/95 dark:bg-[#0a1628]/95 border-l border-black/5 dark:border-white/10 backdrop-blur-xl overflow-y-auto z-[1001] shadow-2xl transition-colors"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{s.id}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.carrier}</p>
          </div>
          <button
            onClick={() => selectShipment(null)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Route with port pins */}
          <div className="bg-black/5 dark:bg-white/[0.04] rounded-lg p-3 transition-colors">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Route</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex flex-col items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-cyan-500 dark:bg-cyan-400 border-2 border-cyan-500/40 dark:border-cyan-400/40" />
                <div className="w-px h-6 bg-gradient-to-b from-cyan-500/60 to-purple-500/60 dark:from-cyan-400/60 dark:to-purple-400/60" />
                <div className="h-3 w-3 rounded-full bg-purple-500 dark:bg-purple-400 border-2 border-purple-500/40 dark:border-purple-400/40" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-slate-800 dark:text-white font-bold">{s.origin}</span>
                <span className="text-xs text-slate-800 dark:text-white font-bold">{s.destination}</span>
              </div>
            </div>
            <div className="mt-1 h-1.5 bg-black/5 dark:bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${s.progress * 100}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium mt-1">{Math.round(s.progress * 100)}% complete</p>
          </div>

          {/* Status & Risk */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/5 dark:bg-white/[0.04] rounded-lg p-3 transition-colors">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1.5">Status</p>
              <StatusChip status={s.status} size="sm" />
            </div>
            <div className="bg-black/5 dark:bg-white/[0.04] rounded-lg p-3 transition-colors">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1.5">Risk Score</p>
              <RiskBadge level={s.risk_level} score={s.risk_score} size="sm" pulse />
            </div>
          </div>

          {/* Details */}
          <div className="bg-black/5 dark:bg-white/[0.04] rounded-lg p-3 space-y-2 transition-colors">
            {[
              { label: 'ETA',     value: s.eta_days ? `${s.eta_days} days` : 'N/A' },
              { label: 'Speed',   value: `${s.speed_kmh} km/h` },
              { label: 'Cargo',   value: s.cargo_type },
              { label: 'Value',   value: `$${(s.value_usd / 1000).toFixed(0)}K` },
              { label: 'Anomaly', value: s.is_anomaly ? '⚠ Detected' : '✓ Normal' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
                <span className={clsx(
                  'font-bold',
                  label === 'Anomaly' && s.is_anomaly ? 'text-amber-500 dark:text-amber-400' : 'text-slate-800 dark:text-white'
                )}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Risk factors */}
          {s.top_risk_factors.length > 0 && (
            <div className="bg-black/5 dark:bg-white/[0.04] rounded-lg p-3 transition-colors">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Risk Factors</p>
              <div className="flex flex-wrap gap-1.5">
                {s.top_risk_factors.map((f) => (
                  <span key={f} className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded px-1.5 py-0.5 font-bold">
                    {f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coordinates */}
          <div className="bg-black/5 dark:bg-white/[0.04] rounded-lg p-3 transition-colors">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Current Position</p>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 font-bold">
              {s.lat.toFixed(4)}°{s.lat >= 0 ? 'N' : 'S'}, {Math.abs(s.lng).toFixed(4)}°{s.lng >= 0 ? 'E' : 'W'}
            </p>
          </div>

          {/* Suggested reroute */}
          {(s.risk_level === 'high' || s.risk_level === 'critical') && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">⚠ Reroute Suggested (LLM+ML)</p>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-2">
                Risk level {s.risk_level}. LLM Analysis suggests alternate routing via Cape of Good Hope or Singapore hub.
              </p>
              <div className="flex flex-col gap-1 mt-2 text-[10px]">
                <div className="flex justify-between items-center bg-black/5 dark:bg-black/20 px-2 py-1.5 rounded">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Est. Delay</span>
                  <span className="text-slate-800 dark:text-white font-bold">+3.2 Days</span>
                </div>
                <div className="flex justify-between items-center bg-black/5 dark:bg-black/20 px-2 py-1.5 rounded">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Cost Impact</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">+$12,400</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
