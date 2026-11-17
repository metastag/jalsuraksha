import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Wrench,
  MapPin,
  PlusCircle,
  Crosshair,
} from 'lucide-react';

const GREATER_NOIDA_CENTER = [77.535, 28.458]; // [lng, lat]

export default function RiskMap({
  sources,
  filters,
  setFilters,
  onSelectSource,
  selectedSourceId,
  onOpenReportAtCoords,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [pinPickMode, setPinPickMode] = useState(false);

  // Initialize MapLibre GL JS with OpenFreeMap tiles
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: GREATER_NOIDA_CENTER,
      zoom: 11.4,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle click on map when user is in "Drop Pin to Report New Source" mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      if (!pinPickMode) return;
      const { lng, lat } = e.lngLat;
      setPinPickMode(false);
      onOpenReportAtCoords({
        latitude: Number(lat.toFixed(5)),
        longitude: Number(lng.toFixed(5)),
      });
    };

    map.on('click', handleMapClick);
    map.getCanvas().style.cursor = pinPickMode ? 'crosshair' : '';

    return () => {
      map.off('click', handleMapClick);
    };
  }, [pinPickMode, onOpenReportAtCoords]);

  // Render color-coded source markers on MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    sources.forEach((src) => {
      const lat = parseFloat(src.latitude);
      const lng = parseFloat(src.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const el = document.createElement('div');
      const isSelected = Number(selectedSourceId) === Number(src.id);

      let bgClass = 'bg-emerald-600 border-white';
      if (src.status === 'resolved') {
        bgClass = 'bg-emerald-600 border-white';
      } else if (src.risk_level === 'high') {
        bgClass = 'bg-red-600 border-white marker-high-pulse';
      } else if (src.risk_level === 'medium') {
        bgClass = 'bg-amber-500 border-white';
      }

      el.className = `cursor-pointer flex items-center justify-center rounded-full border-2 shadow-lg text-white font-extrabold text-[11px] transition-transform ${bgClass} ${
        isSelected ? 'w-10 h-10 scale-125 ring-4 ring-sky-400' : 'w-8 h-8 hover:scale-110'
      }`;
      el.innerHTML = `<span>${Math.round(src.risk_score)}</span>`;
      el.title = `${src.name} (${src.risk_level.toUpperCase()} Risk: ${src.risk_score}/100)`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectSource(src.id);
        map.flyTo({ center: [lng, lat], zoom: 13.5, duration: 750 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [sources, selectedSourceId, onSelectSource]);

  const highCount = sources.filter((s) => s.risk_level === 'high' && s.status !== 'resolved').length;
  const medCount = sources.filter((s) => s.risk_level === 'medium' && s.status !== 'resolved').length;
  const lowCount = sources.filter((s) => s.risk_level === 'low' || s.status === 'resolved').length;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Sidebar: Source Explorer & Filter Controls */}
      <div className="w-full lg:w-[430px] bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-hidden">
        {/* Filter Header */}
        <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search locality, source name or code (e.g. Kasna, Dankaur)..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              aria-label="Filter by Risk Level"
              value={filters.risk_level}
              onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
              className="text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk (Unsafe)</option>
              <option value="medium">Medium Risk (Caution)</option>
              <option value="low">Low Risk (Safe)</option>
            </select>

            <select
              aria-label="Filter by Source Type"
              value={filters.source_type}
              onChange={(e) => setFilters({ ...filters, source_type: e.target.value })}
              className="text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="all">All Source Types</option>
              <option value="handpump">Handpumps</option>
              <option value="well">Open Wells</option>
              <option value="tank">Community Tanks</option>
            </select>

            <select
              aria-label="Filter by Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
            >
              <option value="all">All PHED Statuses</option>
              <option value="reported">Reported</option>
              <option value="verified">Verified</option>
              <option value="under_treatment">Under Treatment</option>
              <option value="resolved">Resolved (Safe)</option>
            </select>
          </div>

          {/* Quick Risk Summary Pills */}
          <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
            <div className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-800">
              <div className="text-sm font-extrabold">{highCount}</div>
              <div className="text-[10px] font-semibold uppercase">High Risk</div>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <div className="text-sm font-extrabold">{medCount}</div>
              <div className="text-[10px] font-semibold uppercase">Medium Risk</div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              <div className="text-sm font-extrabold">{lowCount}</div>
              <div className="text-[10px] font-semibold uppercase">Safe / Treated</div>
            </div>
          </div>
        </div>

        {/* Source List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {sources.map((src) => {
            const isSelected = Number(selectedSourceId) === Number(src.id);
            const badgeColor =
              src.status === 'resolved'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : src.risk_level === 'high'
                ? 'bg-red-100 text-red-800 border-red-300'
                : src.risk_level === 'medium'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300';

            return (
              <div
                key={src.id}
                onClick={() => {
                  onSelectSource(src.id);
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: [parseFloat(src.longitude), parseFloat(src.latitude)],
                      zoom: 13.5,
                      duration: 700,
                    });
                  }
                }}
                className={`p-3.5 cursor-pointer transition hover:bg-sky-50/50 ${
                  isSelected ? 'bg-sky-50 border-l-4 border-sky-600' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {src.code}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {src.source_type}
                      </span>
                      <span className="text-[10px] capitalize font-medium text-slate-500">
                        • {src.confidence_level} confidence
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{src.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {src.locality}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}>
                      {src.risk_score} • {src.risk_level}
                    </span>
                    <div className="text-[10px] font-semibold text-slate-500 mt-1 capitalize">
                      {src.status.replace('_', ' ')} ({src.report_count || 0} reports)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Main Area: Interactive OpenFreeMap + MapLibre GL Canvas */}
      <div className="relative flex-1 h-full bg-slate-200">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Map Action Bar (Top-Left) */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPinPickMode(!pinPickMode)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg border transition ${
              pinPickMode
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Crosshair className="w-4 h-4 text-sky-600" />
            {pinPickMode
              ? 'Click anywhere on map to place new source pin...'
              : 'Drop Pin on Map to Report New Source'}
          </button>
        </div>

        {/* Floating Legend (Bottom-Left) */}
        <div className="absolute bottom-5 left-3 z-10 bg-white/95 backdrop-blur px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1.5">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            BIS IS 10500 Contamination Risk Legend
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 inline-block border border-white shadow" />
              <span className="font-semibold text-slate-700">High Risk (≥65 Unsafe)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block border border-white shadow" />
              <span className="font-semibold text-slate-700">Medium Risk (35–64 Caution)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 inline-block border border-white shadow" />
              <span className="font-semibold text-slate-700">Low Risk (&lt;35 Safe / Treated)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
