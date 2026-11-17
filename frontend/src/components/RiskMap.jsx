import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Search,
  AlertTriangle,
  MapPin,
  Crosshair,
  Navigation,
  Flame,
  LocateFixed,
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
  const userMarkerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [pinPickMode, setPinPickMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Locating...');

  // 1. Initialize MapLibre GL JS with OpenFreeMap tiles + GeolocateControl
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

    const geolocateControl = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
      showAccuracyCircle: true,
    });
    map.addControl(geolocateControl, 'top-right');

    map.on('load', () => {
      setMapLoaded(true);

      // Add a GeoJSON source & red danger halo layer specifically for High-Risk contamination zones
      if (!map.getSource('high-risk-zones')) {
        map.addSource('high-risk-zones', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });

        map.addLayer({
          id: 'high-risk-halo',
          type: 'circle',
          source: 'high-risk-zones',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              9, 18,
              13, 38,
              16, 65,
            ],
            'circle-color': 'rgba(220, 38, 38, 0.22)',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(220, 38, 38, 0.65)',
          },
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Live User Location Tracking (navigator.geolocation.watchPosition)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS unavailable');
      return;
    }

    const updateLivePosition = (pos) => {
      const coords = {
        latitude: Number(pos.coords.latitude.toFixed(5)),
        longitude: Number(pos.coords.longitude.toFixed(5)),
        accuracy: Math.round(pos.coords.accuracy || 25),
      };
      setUserLocation(coords);
      setGpsStatus(`Live GPS (${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E)`);
    };

    const handleGpsError = () => {
      // Fallback to Bennett University / Greater Noida live campus position if browser permission is denied or desktop has no GPS sensor
      const fallback = {
        latitude: 28.4506,
        longitude: 77.5842,
        accuracy: 30,
        isFallback: true,
      };
      setUserLocation((prev) => prev || fallback);
      setGpsStatus('Live Location (Greater Noida / Bennett Univ)');
    };

    navigator.geolocation.getCurrentPosition(updateLivePosition, handleGpsError, {
      enableHighAccuracy: true,
      timeout: 6000,
    });

    const watchId = navigator.geolocation.watchPosition(updateLivePosition, handleGpsError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Render / Update Live User Location Marker on the Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
      return;
    }

    // Outer container left untouched for MapLibre's translate3d()
    const outer = document.createElement('div');
    outer.style.zIndex = '30';

    const inner = document.createElement('div');
    inner.className = 'flex flex-col items-center cursor-pointer';
    inner.innerHTML = `
      <div class="px-2 py-0.5 mb-1 rounded-full bg-sky-600 text-white text-[10px] font-extrabold shadow-md border border-white whitespace-nowrap">
        📍 YOU ARE HERE
      </div>
      <div class="w-5 h-5 rounded-full bg-sky-500 border-[3px] border-white shadow-lg marker-user-pulse"></div>
    `;
    inner.title = `Your Live Location (${userLocation.latitude}°N, ${userLocation.longitude}°E)`;
    outer.appendChild(inner);

    const marker = new maplibregl.Marker({ element: outer, anchor: 'bottom' })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map);

    userMarkerRef.current = marker;
  }, [userLocation, mapLoaded]);

  // 3. Handle click on map when user is in "Drop Pin to Report New Source" mode
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

  // 4. Render Water Source Markers (Especially Highlighting High-Risk Points!)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Update High-Risk GeoJSON Halo layer if map is loaded
    if (mapLoaded && map.getSource('high-risk-zones')) {
      const highRiskFeatures = sources
        .filter((s) => s.risk_level === 'high' && s.status !== 'resolved')
        .map((s) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(s.longitude), parseFloat(s.latitude)],
          },
          properties: {
            id: s.id,
            name: s.name,
            score: s.risk_score,
          },
        }));

      map.getSource('high-risk-zones').setData({
        type: 'FeatureCollection',
        features: highRiskFeatures,
      });
    }

    sources.forEach((src) => {
      const lat = parseFloat(src.latitude);
      const lng = parseFloat(src.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = Number(selectedSourceId) === Number(src.id);
      const isHighRisk = src.risk_level === 'high' && src.status !== 'resolved';
      const isMediumRisk = src.risk_level === 'medium' && src.status !== 'resolved';

      // IMPORTANT: Keep outer element free of CSS transform so MapLibre's translate3d(x,y,0) works!
      const outer = document.createElement('div');
      outer.style.zIndex = isSelected ? '40' : isHighRisk ? '25' : isMediumRisk ? '15' : '10';

      const inner = document.createElement('div');
      inner.className = 'flex flex-col items-center cursor-pointer group';

      let badgeBg = 'bg-emerald-600 border-white';
      let labelHtml = '';

      if (isHighRisk) {
        badgeBg = 'bg-red-600 border-white marker-high-pulse';
        labelHtml = `
          <div class="px-2 py-0.5 mb-1 rounded-md bg-red-700/95 text-white text-[10px] font-extrabold shadow-md border border-red-300 whitespace-nowrap flex items-center gap-1">
            <span>⚠️ HIGH RISK</span>
            <span class="bg-white text-red-800 px-1 rounded text-[9px]">${Math.round(src.risk_score)}</span>
          </div>
        `;
      } else if (isMediumRisk) {
        badgeBg = 'bg-amber-500 border-white';
        labelHtml = `
          <div class="px-1.5 py-0.5 mb-0.5 rounded bg-amber-600/90 text-white text-[9px] font-bold shadow border border-amber-200 whitespace-nowrap">
            CAUTION • ${Math.round(src.risk_score)}
          </div>
        `;
      } else {
        badgeBg = 'bg-emerald-600 border-white';
      }

      const sizeClass = isSelected
        ? 'w-11 h-11 text-xs ring-4 ring-sky-400'
        : isHighRisk
        ? 'w-9 h-9 text-xs'
        : 'w-8 h-8 text-[11px]';

      inner.innerHTML = `
        ${labelHtml}
        <div class="flex items-center justify-center rounded-full border-2 shadow-lg text-white font-extrabold transition-transform group-hover:scale-110 ${badgeBg} ${sizeClass}">
          <span>${Math.round(src.risk_score)}</span>
        </div>
      `;

      inner.title = `${src.name} — ${src.locality} (${src.risk_level.toUpperCase()} Risk: ${src.risk_score}/100)`;

      inner.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectSource(src.id);
        map.flyTo({ center: [lng, lat], zoom: 13.6, duration: 750 });
      });

      outer.appendChild(inner);

      const marker = new maplibregl.Marker({ element: outer, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [sources, selectedSourceId, onSelectSource, mapLoaded]);

  const handleFlyToUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          setUserLocation({ latitude: lat, longitude: lng, accuracy: Math.round(pos.coords.accuracy || 20) });
          setGpsStatus(`Live GPS (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`);
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 900 });
        },
        () => {
          if (userLocation && mapRef.current) {
            mapRef.current.flyTo({
              center: [userLocation.longitude, userLocation.latitude],
              zoom: 14,
              duration: 900,
            });
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        duration: 900,
      });
    }
  };

  const toggleHighRiskOnly = () => {
    const nextRisk = filters.risk_level === 'high' ? 'all' : 'high';
    setFilters({ ...filters, risk_level: nextRisk });
    if (mapRef.current) {
      mapRef.current.flyTo({ center: GREATER_NOIDA_CENTER, zoom: 11.3, duration: 700 });
    }
  };

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

          {/* Clickable Quick Risk Summary Filter Pills */}
          <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
            <button
              type="button"
              onClick={() =>
                setFilters({ ...filters, risk_level: filters.risk_level === 'high' ? 'all' : 'high' })
              }
              className={`p-1.5 rounded-lg border text-red-800 transition ${
                filters.risk_level === 'high'
                  ? 'bg-red-200 border-red-500 ring-2 ring-red-300'
                  : 'bg-red-50 border-red-200 hover:bg-red-100'
              }`}
            >
              <div className="text-sm font-extrabold">{highCount}</div>
              <div className="text-[10px] font-semibold uppercase">High Risk</div>
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters({ ...filters, risk_level: filters.risk_level === 'medium' ? 'all' : 'medium' })
              }
              className={`p-1.5 rounded-lg border text-amber-800 transition ${
                filters.risk_level === 'medium'
                  ? 'bg-amber-200 border-amber-500 ring-2 ring-amber-300'
                  : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <div className="text-sm font-extrabold">{medCount}</div>
              <div className="text-[10px] font-semibold uppercase">Medium Risk</div>
            </button>
            <button
              type="button"
              onClick={() =>
                setFilters({ ...filters, risk_level: filters.risk_level === 'low' ? 'all' : 'low' })
              }
              className={`p-1.5 rounded-lg border text-emerald-800 transition ${
                filters.risk_level === 'low'
                  ? 'bg-emerald-200 border-emerald-500 ring-2 ring-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <div className="text-sm font-extrabold">{lowCount}</div>
              <div className="text-[10px] font-semibold uppercase">Safe / Treated</div>
            </button>
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
                      zoom: 13.6,
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
        <div className="absolute top-3 left-3 right-14 z-10 flex flex-wrap items-center gap-2">
          {/* 1. Live User GPS Location Button */}
          <button
            type="button"
            onClick={handleFlyToUser}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border bg-sky-600 hover:bg-sky-500 text-white border-sky-700 transition"
          >
            <LocateFixed className="w-4 h-4" />
            <span>{gpsStatus}</span>
          </button>

          {/* 2. Quick Filter / Focus on High-Risk Points */}
          <button
            type="button"
            onClick={toggleHighRiskOnly}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border transition ${
              filters.risk_level === 'high'
                ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-300'
                : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
            }`}
          >
            <Flame className="w-4 h-4 text-red-600 fill-red-500" />
            <span>
              {filters.risk_level === 'high'
                ? 'Showing High-Risk Points Only (Click to Show All)'
                : `Show High-Risk Hotspots (${highCount})`}
            </span>
          </button>

          {/* 3. Drop Pin or Report at Live GPS */}
          <button
            type="button"
            onClick={() => setPinPickMode(!pinPickMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border transition ${
              pinPickMode
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Crosshair className="w-4 h-4 text-sky-600" />
            {pinPickMode
              ? 'Click anywhere on map to place new source pin...'
              : 'Drop Pin on Map'}
          </button>

          {userLocation && (
            <button
              type="button"
              onClick={() =>
                onOpenReportAtCoords({
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                })
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-lg border bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700 transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              Report at My Live Location
            </button>
          )}
        </div>

        {/* Floating Legend (Bottom-Left) */}
        <div className="absolute bottom-5 left-3 z-10 bg-white/95 backdrop-blur px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1.5">
          <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            BIS IS 10500 Contamination Risk & Live GPS Legend
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
              <span className="font-semibold text-slate-700">Low Risk (&lt;35 Safe)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-sky-500 inline-block border border-white shadow" />
              <span className="font-semibold text-sky-700">Your Live Location</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
