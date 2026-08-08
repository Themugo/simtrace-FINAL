"use client";

import React, { useState } from "react";
import {
  Compass,
  Radio,
  ShieldAlert,
  Activity,
  RefreshCw,
  Layers,
  Flame,
  TowerControl,
  Target,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Sliders,
  Info,
} from "lucide-react";
import {
  GeointService,
  DigitalTwinSnapshot,
  CarrierTower,
  Geofence,
  LocationEvent,
} from "../../../services/geoint.service";

export default function OperationalMapPage() {
  const [snapshot, setSnapshot] = useState<DigitalTwinSnapshot>(
    GeointService.getDigitalTwinSnapshot("CASE-KE-2026-0891")
  );

  // Layer Management System State
  const [layers, setLayers] = useState({
    towers: true,     // 'Carrier Network Towers'
    heatmaps: true,   // 'Historical Heatmaps'
    geofences: true,  // 'Active Geofences'
  });

  const [geofenceRadius, setGeofenceRadius] = useState<number>(500);

  const carrierTowers: CarrierTower[] = GeointService.getCarrierTowers();
  const geofences: Geofence[] = GeointService.getGeofences();
  const locationEvents: LocationEvent[] = GeointService.getLocationEvents();

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const setAllLayers = (enable: boolean) => {
    setLayers({
      towers: enable,
      heatmaps: enable,
      geofences: enable,
    });
  };

  const activeLayersCount = Object.values(layers).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-600 rounded-xl text-white shadow-lg shadow-cyan-900/40">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base">SimTrace Operational Tactical Map</h1>
            <p className="text-xs text-slate-400">
              Live Field Operations, Geospatial Intelligence & Interactive Layer Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Layers Active: <strong className="text-white">{activeLayersCount}/3</strong></span>
          </div>

          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> LIVE DIGITAL TWIN
          </span>

          <button
            onClick={() => setSnapshot(GeointService.getDigitalTwinSnapshot("CASE-KE-2026-0891"))}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition"
            title="Refresh Digital Twin Snapshot"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 p-4 gap-4 overflow-hidden">
        
        {/* Map Stage & Overlay Controls */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl relative p-5 flex flex-col justify-between overflow-hidden min-h-[520px]">
          
          {/* Top Bar on Map */}
          <div className="flex justify-between items-center z-20 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 shadow">
                Case ID: {snapshot.caseId}
              </div>
              <div className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 shadow">
                Target Sector: Nairobi Metropolitan
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              Updated: {new Date(snapshot.timestamp).toLocaleTimeString()}
            </div>
          </div>

          {/* Tactical Map Grid Canvas */}
          <div className="relative w-full h-[400px] my-4 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
            
            {/* Grid background texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-60" />

            {/* Tactical Compass Rose Watermark */}
            <div className="absolute right-6 bottom-6 opacity-10 pointer-events-none">
              <Compass className="w-32 h-32 text-cyan-400" />
            </div>

            {/* ========================================================= */}
            {/* LAYER 1: HISTORICAL HEATMAPS OVERLAY                      */}
            {/* ========================================================= */}
            {layers.heatmaps && (
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Heatmap Density Spot 1 (Central CBD) */}
                <div 
                  className="absolute w-44 h-44 rounded-full blur-2xl opacity-40 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 animate-pulse"
                  style={{ top: '22%', left: '26%' }}
                />
                {/* Heatmap Density Spot 2 (Upper Hill Transit) */}
                <div 
                  className="absolute w-36 h-36 rounded-full blur-2xl opacity-35 bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-600"
                  style={{ top: '48%', left: '42%' }}
                />
                {/* Heatmap Density Spot 3 (Industrial Area Node) */}
                <div 
                  className="absolute w-40 h-40 rounded-full blur-2xl opacity-30 bg-gradient-to-r from-emerald-400 via-cyan-500 to-amber-500"
                  style={{ top: '60%', left: '60%' }}
                />

                {/* Telemetry Heatmap Location Event Dots */}
                {locationEvents.map((evt, idx) => (
                  <div
                    key={evt.id}
                    className="absolute flex items-center justify-center"
                    style={{ top: `${26 + idx * 18}%`, left: `${28 + idx * 15}%` }}
                  >
                    <div className="w-4 h-4 rounded-full bg-amber-400/30 border border-amber-400/60 animate-ping" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                ))}

                {/* Heatmap Intensity Scale Indicator */}
                <div className="absolute left-4 bottom-4 bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-[10px] font-mono flex items-center gap-2 pointer-events-auto shadow-lg">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300">Heat Density:</span>
                  <div className="w-20 h-2 rounded bg-gradient-to-r from-cyan-500 via-amber-400 to-red-600" />
                  <span className="text-slate-400">Low → High</span>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 2: ACTIVE GEOFENCES OVERLAY                          */}
            {/* ========================================================= */}
            {layers.geofences && (
              <div className="absolute inset-0 z-15 pointer-events-none">
                {/* Geofence 1: Nairobi Central Bank Geofence */}
                <div 
                  className="absolute border-2 border-dashed border-rose-500/80 bg-rose-500/10 rounded-full flex flex-col items-center justify-center p-2 transition-all"
                  style={{ 
                    top: '15%', 
                    left: '20%', 
                    width: `${Math.min(340, Math.max(70, Math.round(geofenceRadius * 0.32)))}px`, 
                    height: `${Math.min(340, Math.max(70, Math.round(geofenceRadius * 0.32)))}px` 
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping mb-1" />
                  <div className="bg-slate-950/90 border border-rose-500/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-rose-300 pointer-events-auto flex items-center gap-1 shadow">
                    <Target className="w-3 h-3 text-rose-400" />
                    Nairobi Central Bank ({geofenceRadius}m)
                  </div>
                  <span className="text-[9px] font-mono text-rose-400 mt-1 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                    RISK: CRITICAL [BREACHED]
                  </span>
                </div>

                {/* Geofence 2: JKIA Airport Transit Zone */}
                <div 
                  className="absolute border-2 border-dashed border-amber-500/70 bg-amber-500/10 rounded-full flex flex-col items-center justify-center p-2 transition-all"
                  style={{ 
                    top: '45%', 
                    left: '55%', 
                    width: `${Math.min(360, Math.max(80, Math.round(geofenceRadius * 0.38)))}px`, 
                    height: `${Math.min(360, Math.max(80, Math.round(geofenceRadius * 0.38)))}px` 
                  }}
                >
                  <div className="bg-slate-950/90 border border-amber-500/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300 pointer-events-auto flex items-center gap-1 shadow">
                    <Target className="w-3 h-3 text-amber-400" />
                    JKIA Transit Zone ({Math.round(geofenceRadius * 1.5)}m)
                  </div>
                  <span className="text-[9px] font-mono text-amber-400 mt-1 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                    RISK: HIGH [MONITORED]
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* LAYER 3: CARRIER NETWORK TOWERS OVERLAY                    */}
            {/* ========================================================= */}
            {layers.towers && (
              <div className="absolute inset-0 z-20 pointer-events-none">
                {carrierTowers.map((tower, idx) => {
                  const positions = [
                    { top: '24%', left: '32%' },
                    { top: '52%', left: '46%' },
                    { top: '68%', left: '66%' },
                    { top: '38%', left: '78%' },
                  ];
                  const pos = positions[idx % positions.length];
                  const isDegraded = tower.status === "MAINTENANCE";

                  return (
                    <div
                      key={tower.id}
                      className="absolute pointer-events-auto group cursor-pointer"
                      style={{ top: pos.top, left: pos.left }}
                    >
                      {/* Antenna signal ring */}
                      <div className={`absolute -inset-3 rounded-full border ${isDegraded ? 'border-amber-500/30' : 'border-cyan-500/40'} animate-ping opacity-75`} />
                      
                      {/* Tower Icon Box */}
                      <div className={`p-1.5 rounded-lg border shadow-xl flex items-center gap-1.5 bg-slate-950/90 ${
                        isDegraded ? 'border-amber-500/70 text-amber-400' : 'border-cyan-500/70 text-cyan-400'
                      }`}>
                        <TowerControl className="w-4 h-4" />
                        <div className="text-[10px] font-mono leading-tight">
                          <div className="font-bold text-white flex items-center gap-1">
                            {tower.id}
                            <span className={`px-1 py-0.2 rounded text-[8px] ${
                              tower.operator === 'Safaricom' ? 'bg-emerald-900/60 text-emerald-300' :
                              tower.operator === 'Airtel' ? 'bg-rose-900/60 text-rose-300' : 'bg-blue-900/60 text-blue-300'
                            }`}>
                              {tower.operator}
                            </span>
                          </div>
                          <div className="text-slate-400">{tower.signalStrengthDbm} dBm</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* BASE LAYER: Active Tracked Entities / Units */}
            <div className="absolute inset-0 z-30 pointer-events-none">
              {snapshot.activeEntities.map((entity, idx) => (
                <div
                  key={entity.entityId}
                  className="absolute pointer-events-auto flex items-center gap-2 p-2 bg-slate-950/95 border border-emerald-500 rounded-xl shadow-2xl"
                  style={{ top: `${32 + idx * 30}%`, left: `${24 + idx * 38}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div className="text-[11px] font-mono">
                    <div className="font-bold text-white flex items-center gap-1">
                      {entity.entityId}
                      <span className="text-[9px] px-1 bg-emerald-950 text-emerald-400 border border-emerald-700 rounded">
                        RISK {entity.riskScore}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      Lat: {entity.latitude} | Lon: {entity.longitude}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Map Footer Information */}
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono z-10">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Unit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Carrier Tower
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Heatmap Spot
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Geofence Zone
              </span>
            </div>
            <span>Projection: EPSG:4326 (WGS84)</span>
          </div>
        </div>

        {/* Right Drawer: Layer Control & Operational Field Status */}
        <div className="space-y-4 text-xs">
          
          {/* LAYER MANAGEMENT SYSTEM CONTROL PANEL */}
          <div id="layer-management" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Layer Management System
              </h2>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-mono text-[10px]">
                {activeLayersCount}/3 ON
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Toggle tactical map layers independently to analyze carrier infrastructure, historical telemetry density, or geofence perimeters.
            </p>

            {/* Layer Toggles */}
            <div className="space-y-2 pt-1">
              {/* TOGGLE 1: Carrier Network Towers */}
              <div 
                onClick={() => toggleLayer('towers')}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  layers.towers 
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-white' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TowerControl className={`w-4 h-4 ${layers.towers ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs">Carrier Network Towers</div>
                    <div className="text-[10px] text-slate-400">4 Active Masts (Safaricom, Airtel, Telkom)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    layers.towers ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {layers.towers ? 'VISIBLE' : 'HIDDEN'}
                  </span>
                  {layers.towers ? (
                    <Eye className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* TOGGLE 2: Historical Heatmaps */}
              <div 
                onClick={() => toggleLayer('heatmaps')}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  layers.heatmaps 
                    ? 'bg-amber-950/40 border-amber-500/50 text-white' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className={`w-4 h-4 ${layers.heatmaps ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs">Historical Heatmaps</div>
                    <div className="text-[10px] text-slate-400">Location density & telemetry trail</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    layers.heatmaps ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {layers.heatmaps ? 'VISIBLE' : 'HIDDEN'}
                  </span>
                  {layers.heatmaps ? (
                    <Eye className="w-4 h-4 text-amber-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* TOGGLE 3: Active Geofences */}
              <div 
                onClick={() => toggleLayer('geofences')}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  layers.geofences 
                    ? 'bg-rose-950/40 border-rose-500/50 text-white' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Target className={`w-4 h-4 ${layers.geofences ? 'text-rose-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs">Active Geofences</div>
                    <div className="text-[10px] text-slate-400">2 Monitored Zones ({geofenceRadius}m base radius)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    layers.geofences ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {layers.geofences ? 'VISIBLE' : 'HIDDEN'}
                  </span>
                  {layers.geofences ? (
                    <Eye className="w-4 h-4 text-rose-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Geofence Perimeter Radius Slider Control */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="geofence-radius-slider" className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  Geofence Perimeter Radius
                </label>
                <span className="font-mono text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded shadow">
                  {geofenceRadius}m
                </span>
              </div>
              <input
                id="geofence-radius-slider"
                type="range"
                min="100"
                max="3000"
                step="50"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500 border border-slate-800"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>100m</span>
                <span>1500m</span>
                <span>3000m</span>
              </div>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
              <button
                onClick={() => setAllLayers(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono transition"
              >
                Enable All Layers
              </button>
              <button
                onClick={() => setAllLayers(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded font-mono transition"
              >
                Disable All
              </button>
            </div>
          </div>

          {/* OPERATIONAL FIELD STATUS DRAWER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h2 className="font-bold text-white text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Operational Field Status
            </h2>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-slate-400 text-[10px]">ACTIVE TRACKED ENTITIES</div>
                  <div className="text-lg font-extrabold text-emerald-400">{snapshot.activeEntities.length}</div>
                </div>
                <Radio className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-slate-400 text-[10px]">GEOFENCE BREACHES</div>
                  <div className="text-lg font-extrabold text-rose-400">{snapshot.activeGeofenceBreachesCount}</div>
                </div>
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-slate-400 text-[10px]">REGISTERED CARRIER TOWERS</div>
                  <div className="text-lg font-extrabold text-cyan-400">{carrierTowers.length}</div>
                </div>
                <TowerControl className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
