"use client";
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Dynamic imports for leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet + webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color) => new L.Icon({
  iconUrl:    `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl:  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:   [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const ICONS = {
  stolen:      makeIcon("red"),
  blacklisted: makeIcon("orange"),
  recovered:   makeIcon("blue"),
  active:      makeIcon("green"),
};

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LiveMap({ token, deviceImeis = [], showAll = false, style: extraStyle = {} }) {
  const [positions, setPositions] = useState({});  // { imei: { lat, lng, ts, status, make, model } }
  const [alerts,    setAlerts]    = useState([]);
  const socketRef = useRef(null);

  // ── Fetch initial snapshot from REST API ────────────────────────────────────
  useEffect(() => {
    async function fetchInitial() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res  = await fetch(`${BASE}/api/devices`, { headers });
        if (!res.ok) return;
        const devs = await res.json();

        // For each device fetch latest ping
        const entries = await Promise.all(
          devs.filter(d => showAll || deviceImeis.includes(d.imei)).map(async d => {
            try {
              const pr = await fetch(`${BASE}/api/imei/${d.imei}/history?limit=1`, { headers });
              const pings = await pr.json();
              const p = pings[0];
              if (!p) return null;
              return [d.imei, { lat: p.lat, lng: p.lng, ts: p.ts, status: d.status, make: d.make, model: d.model }];
            } catch { return null; }
          })
        );

        const initial = {};
        for (const e of entries) { if (e) initial[e[0]] = e[1]; }
        setPositions(initial);
      } catch (err) {
        console.warn("[LiveMap] Failed to fetch initial positions:", err.message);
      }
    }
    fetchInitial();
  }, [token, showAll, deviceImeis.join(",")]);

  // ── Socket.io — real-time updates ──────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || BASE, { auth: { token } });

    socket.on("connect", () => {
      deviceImeis.forEach(imei => socket.emit("subscribe_device", imei));
      if (showAll) socket.emit("subscribe_all_admin");
    });

    socket.on("location_update", (data) => {
      setPositions(prev => ({
        ...prev,
        [data.imei]: { ...prev[data.imei], lat: data.lat, lng: data.lng, ts: data.ts, status: data.status ?? "active" },
      }));
    });

    socket.on("alert", (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 20));
    });

    socketRef.current = socket;
    return () => socket.disconnect();
  }, [token]);

  const markerList = Object.entries(positions).filter(([, p]) => p.lat && p.lng);
  const stolenList = markerList.filter(([, p]) => p.status === "stolen" || p.status === "blacklisted");

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[-1.286, 36.817]}
        zoom={12}
        style={{ height: 480, borderRadius: 12, border: "1px solid #1e2d45", ...extraStyle }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CartoDB</a>'
        />

        {markerList.map(([imei, pos]) => (
          <Marker key={imei} position={[pos.lat, pos.lng]} icon={ICONS[pos.status] || ICONS.active}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{pos.make || ""} {pos.model || "Device"}</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.8rem", marginBottom: 4 }}>IMEI: {imei}</div>
                <div style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: "0.72rem", fontWeight: 700,
                  background: pos.status === "stolen" ? "rgba(251,113,133,0.15)" : pos.status === "recovered" ? "rgba(56,189,248,0.15)" : "rgba(52,211,153,0.15)",
                  color:      pos.status === "stolen" ? "var(--rose)" : pos.status === "recovered" ? "var(--sky-dim)" : "var(--emerald)",
                }}>
                  {pos.status?.toUpperCase()}
                </div>
                {pos.ts && <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>{new Date(pos.ts).toLocaleString()}</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Red pulse circle for stolen devices */}
        {stolenList.map(([imei, pos]) => (
          <Circle key={`circle-${imei}`} center={[pos.lat, pos.lng]} radius={600}
            pathOptions={{ color: "var(--rose)", fillColor: "var(--rose)", fillOpacity: 0.08, weight: 1.5, dashArray: "4 4" }} />
        ))}
      </MapContainer>

      {/* Alert ticker overlay */}
      {alerts.length > 0 && (
        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 1000, pointerEvents: "none" }}>
          <div style={{ background: "rgba(15,17,23,0.97)", border: "1px solid #ef4444", borderRadius: 8, padding: "6px 12px", fontSize: "0.78rem", color: "var(--rose)" }}>
            🚨 {alerts[0].type?.replace(/_/g, " ")} · IMEI {alerts[0].imei} · {new Date(alerts[0].ts).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        {[["🟢","Active"],["🔴","Stolen"],["🟠","Blacklisted"],["🔵","Recovered"]].map(([dot,label]) => (
          <span key={label} style={{ fontSize: "0.72rem", color: "var(--dim)" }}>{dot} {label}</span>
        ))}
        <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: "auto" }}>{markerList.length} device{markerList.length !== 1 ? "s" : ""} on map</span>
      </div>
    </div>
  );
}
