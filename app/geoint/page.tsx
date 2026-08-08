"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  MapPin,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Layers,
  ShieldAlert,
  Compass,
  Activity,
  Zap,
  Radio,
  Sliders,
  Maximize2,
  TrendingUp,
  Clock,
  Navigation,
  Eye,
  Plus,
  Search,
} from "lucide-react";
import {
  GeointService,
  LocationEvent,
  Geofence,
  ReconstructedRoute,
  RouteComparisonResult,
} from "../../services/geoint.service";

export default function GeointDashboardPage() {
  const [route, setRoute] = useState<ReconstructedRoute>(
    GeointService.reconstructRoute("imei-869123049182341")
  );
  const [geofences, setGeofences] = useState<Geofence[]>(GeointService.getGeofences());
  const [comparison, setComparison] = useState<RouteComparisonResult>(
    GeointService.compareRoutes("imei-869123049182341", "msisdn-254712345678")
  );

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 5 | 20>(1);

  // Map Layer Toggles
  const [showTowers, setShowTowers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showRouteLines, setShowRouteLines] = useState(true);

  // Geofence Creation Modal
  const [showModal, setShowModal] = useState(false);
  const [gfName, setGfName] = useState("");
  const [gfLat, setGfLat] = useState(-1.286389);
  const [gfLng, setGfLng] = useState(36.817223);
  const [gfRadius, setGfRadius] = useState(500);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= route.waypoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, route.waypoints.length]);

  const handleCreateGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gfName.trim()) return;

    GeointService.createGeofence({
      organizationId: "org-police-01",
      name: gfName,
      type: "CIRCLE",
      centerLat: Number(gfLat),
      centerLng: Number(gfLng),
      radiusMeters: Number(gfRadius),
      rules: ["ENTER", "LOITERING"],
      riskLevel: "HIGH",
    });

    setGeofences([...GeointService.getGeofences()]);
    setGfName("");
    setShowModal(false);
  };

  const currentPoint = route.waypoints[playbackIndex] || route.waypoints[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base">SimTrace GEOINT & Digital Twin Platform</h1>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold rounded">
                SPATIAL ENGINE v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live GIS Visualization, Time Playback, Historical Route Reconstruction & Geofence Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/operations/map"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-slate-700"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" /> Operational Tactical Map
          </a>
          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Geofence
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Panel Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        {/* Central Tactical GIS Stage (3 cols) */}
        <div className="lg:col-span-3 bg-slate-950 border-r border-slate-800 relative flex flex-col justify-between p-4 min-h-[500px]">
          {/* Layer Control Bar Floating Top Left */}
          <div className="absolute top-6 left-6 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs space-y-2 shadow-2xl">
            <div className="font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> GIS Layer Controls
            </div>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showTowers}
                onChange={(e) => setShowTowers(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              Cell Towers & Handovers
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              Activity Risk Heatmap
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showGeofences}
                onChange={(e) => setShowGeofences(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              Sovereign Geofence Zones
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showRouteLines}
                onChange={(e) => setShowRouteLines(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              Historical Movement Vector
            </label>
          </div>

          {/* Interactive Visual Map Canvas Mock / Vector Representation */}
          <div className="w-full flex-1 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
            {/* Grid overlay for tactical radar aesthetic */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

            {/* Simulated Route Vector Line & Points */}
            <div className="relative w-full h-full p-12 flex flex-col justify-between items-center z-0">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Heatmap overlay glow effect */}
                {showHeatmap && (
                  <div className="w-80 h-80 bg-rose-500/10 rounded-full blur-3xl absolute animate-pulse" />
                )}

                {/* Geofence Circles */}
                {showGeofences &&
                  geofences.map((gf) => (
                    <div
                      key={gf.id}
                      className="absolute rounded-full border-2 border-dashed border-amber-500/60 bg-amber-500/5 flex items-center justify-center p-8"
                      style={{ width: `${gf.radiusMeters / 2}px`, height: `${gf.radiusMeters / 2}px` }}
                    >
                      <span className="text-[10px] font-mono text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                        {gf.name}
                      </span>
                    </div>
                  ))}

                {/* Reconstructed Route Line */}
                {showRouteLines && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="#10b981" strokeWidth="3" strokeDasharray="6" />
                    <line x1="50%" y1="50%" x2="80%" y2="70%" stroke="#10b981" strokeWidth="3" strokeDasharray="6" />
                  </svg>
                )}

                {/* Active Tracking Point Target */}
                {currentPoint && (
                  <div className="relative flex items-center justify-center z-10 transition-all duration-500">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 animate-ping absolute" />
                    <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center">
                      <Radio className="w-3 h-3 text-slate-950" />
                    </div>
                    <div className="absolute top-7 bg-slate-950/90 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap">
                      Lat: {currentPoint.latitude.toFixed(4)} | Lon: {currentPoint.longitude.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time Playback Control Bar Floating Bottom */}
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" /> Historical Spatial Playback Engine
              </span>
              <span className="font-mono text-cyan-300">
                Timestamp: {currentPoint ? new Date(currentPoint.timestamp).toLocaleString() : "N/A"}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={Math.max(0, route.waypoints.length - 1)}
              value={playbackIndex}
              onChange={(e) => setPlaybackIndex(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? "PAUSE" : "PLAY ROUTE"}
                </button>
                <button
                  onClick={() => setPlaybackIndex(0)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                <span>Speed:</span>
                {[1, 5, 20].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s as any)}
                    className={`px-2 py-0.5 rounded ${
                      playbackSpeed === s ? "bg-cyan-600 text-white font-bold" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Intelligence Sidebar (1 col) */}
        <div className="bg-slate-900 p-4 space-y-6 overflow-y-auto text-xs">
          {/* Route Metrics Summary */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h2 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Navigation className="w-4 h-4 text-emerald-400" /> Reconstructed Route Metrics
            </h2>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[10px]">TOTAL DISTANCE</div>
                <div className="text-base font-extrabold text-emerald-400">{route.totalDistanceKm} km</div>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-400 text-[10px]">AVG VELOCITY</div>
                <div className="text-base font-extrabold text-cyan-400">{route.averageSpeedKmH} km/h</div>
              </div>
            </div>
            <div className="text-slate-400">
              Waypoints Logged: <strong className="text-slate-200">{route.pointCount}</strong> | Stops Detected:{" "}
              <strong className="text-amber-400">{route.stops.length}</strong>
            </div>
          </div>

          {/* Multi-Entity Route Proximity Comparison */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h2 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" /> Multi-Device Proximity & Overlap
            </h2>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Targets:</span>
                <span className="font-mono text-cyan-400 font-bold">IMEI1 vs MSISDN2</span>
              </div>
              <div className="flex justify-between">
                <span>Closest Approach:</span>
                <span className="font-mono text-emerald-400 font-bold">{comparison.closestApproachMeters} meters</span>
              </div>
              <div className="flex justify-between">
                <span>Route Similarity:</span>
                <span className="font-mono text-amber-400 font-bold">{comparison.similarityScorePercent}% Match</span>
              </div>
            </div>
          </div>

          {/* Active Geofence Directory */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <h2 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Active Sovereign Geofences
            </h2>
            <div className="space-y-2">
              {geofences.map((gf) => (
                <div key={gf.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded space-y-1">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>{gf.name}</span>
                    <span className="text-rose-400 font-mono text-[10px]">{gf.riskLevel}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Radius: {gf.radiusMeters}m | Rules: {gf.rules.join(", ")}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Geofence Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateGeofence}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 text-xs"
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" /> Create New Sovereign Geofence Zone
            </h2>
            <div>
              <label className="block text-slate-400 mb-1">Geofence Name</label>
              <input
                type="text"
                placeholder="e.g. Parliament Building Security Perimeter"
                value={gfName}
                onChange={(e) => setGfName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Center Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={gfLat}
                  onChange={(e) => setGfLat(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Center Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={gfLng}
                  onChange={(e) => setGfLng(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Radius (Meters)</label>
              <input
                type="number"
                value={gfRadius}
                onChange={(e) => setGfRadius(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded">
                Save Geofence
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
