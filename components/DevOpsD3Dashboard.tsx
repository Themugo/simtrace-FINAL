"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  Activity,
  Cpu,
  Radio,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Server,
  TrendingUp,
  AlertCircle,
  Layers,
} from "lucide-react";

export interface MicroserviceMetricPoint {
  timestamp: Date;
  serviceId: string;
  serviceName: string;
  cpuPercent: number; // 0 - 100%
  latencyMs: number;  // e.g. 5 - 250ms
}

export interface MicroserviceConfig {
  id: string;
  name: string;
  color: string;
  baseCpu: number;
  baseLatency: number;
}

const MICROSERVICES: MicroserviceConfig[] = [
  { id: "api-gateway", name: "API Gateway", color: "#38bdf8", baseCpu: 35, baseLatency: 18 },
  { id: "graph-engine", name: "Intelligence Graph", color: "#a855f7", baseCpu: 58, baseLatency: 42 },
  { id: "telemetry-ingest", name: "Telemetry Ingestion", color: "#10b981", baseCpu: 45, baseLatency: 12 },
  { id: "ai-risk", name: "AI Risk Engine", color: "#f59e0b", baseCpu: 68, baseLatency: 85 },
  { id: "socket-mesh", name: "Socket Mesh", color: "#ec4899", baseCpu: 28, baseLatency: 8 },
  { id: "webhook-delivery", name: "Webhook Engine", color: "#6366f1", baseCpu: 22, baseLatency: 25 },
];

function generateInitialData(): MicroserviceMetricPoint[] {
  const points: MicroserviceMetricPoint[] = [];
  const now = Date.now();
  const historyCount = 25; // 25 data points across time
  const stepMs = 3000;      // 3 seconds intervals

  for (let i = historyCount; i >= 0; i--) {
    const time = new Date(now - i * stepMs);
    MICROSERVICES.forEach((svc) => {
      const cpuNoise = (Math.random() - 0.48) * 12;
      const latNoise = (Math.random() - 0.48) * 18;
      points.push({
        timestamp: time,
        serviceId: svc.id,
        serviceName: svc.name,
        cpuPercent: Math.min(99, Math.max(5, Math.round(svc.baseCpu + cpuNoise))),
        latencyMs: Math.min(450, Math.max(2, Math.round(svc.baseLatency + latNoise))),
      });
    });
  }
  return points;
}

export default function DevOpsD3Dashboard() {
  const [data, setData] = useState<MicroserviceMetricPoint[]>(generateInitialData);
  const [isLive, setIsLive] = useState(true);
  const [metricView, setMetricView] = useState<"DUAL" | "CPU" | "LATENCY">("DUAL");
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MICROSERVICES.forEach((s) => (initial[s.id] = true));
    return initial;
  });
  const [timeWindowSeconds, setTimeWindowSeconds] = useState<number>(75);
  const [hoveredPoint, setHoveredPoint] = useState<{
    time: Date;
    metrics: { service: MicroserviceConfig; cpu: number; latency: number }[];
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Live streaming simulation timer
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setData((prev) => {
        const now = new Date();
        const newPoints: MicroserviceMetricPoint[] = MICROSERVICES.map((svc) => {
          const spikeFactor = Math.random() > 0.92 ? 2.2 : 1.0;
          const cpuNoise = (Math.random() - 0.48) * 14 * spikeFactor;
          const latNoise = (Math.random() - 0.48) * 22 * spikeFactor;
          return {
            timestamp: now,
            serviceId: svc.id,
            serviceName: svc.name,
            cpuPercent: Math.min(99, Math.max(5, Math.round(svc.baseCpu + cpuNoise))),
            latencyMs: Math.min(500, Math.max(2, Math.round(svc.baseLatency + latNoise))),
          };
        });

        // Retain max 35 data points per service
        const cutoffTime = now.getTime() - timeWindowSeconds * 1000;
        const filtered = prev.filter((p) => p.timestamp.getTime() >= cutoffTime);
        return [...filtered, ...newPoints];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLive, timeWindowSeconds]);

  // Simulate traffic spike event
  const triggerTrafficSpike = () => {
    setData((prev) => {
      const now = new Date();
      const spikePoints: MicroserviceMetricPoint[] = MICROSERVICES.map((svc) => ({
        timestamp: now,
        serviceId: svc.id,
        serviceName: svc.name,
        cpuPercent: Math.min(98, Math.round(svc.baseCpu + 35 + Math.random() * 15)),
        latencyMs: Math.min(480, Math.round(svc.baseLatency * 2.8 + Math.random() * 80)),
      }));
      return [...prev, ...spikePoints];
    });
  };

  // Toggle microservice visibility
  const toggleService = (id: string) => {
    setSelectedServices((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Main D3 Rendering Logic
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const height = 340;
    const margin = { top: 25, right: metricView === "DUAL" ? 55 : 30, bottom: 35, left: 50 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", containerWidth).attr("height", height);

    const activeServiceIds = Object.keys(selectedServices).filter((id) => selectedServices[id]);
    const filteredData = data.filter((d) => activeServiceIds.includes(d.serviceId));

    if (filteredData.length === 0) {
      svg
        .append("text")
        .attr("x", containerWidth / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .attr("font-size", "14px")
        .text("No microservices selected. Toggle filters above to visualize trends.");
      return;
    }

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale (Time)
    const timeExtent = d3.extent(filteredData, (d: MicroserviceMetricPoint) => d.timestamp) as [Date, Date];
    const xScale = d3.scaleTime().domain(timeExtent).range([0, innerWidth]);

    // Y Scale (CPU 0-100%)
    const maxCpu = Math.max(100, d3.max(filteredData, (d: MicroserviceMetricPoint) => d.cpuPercent) || 100);
    const yScaleCpu = d3.scaleLinear().domain([0, maxCpu]).range([innerHeight, 0]);

    // Y Scale (Latency ms)
    const maxLatency = Math.max(120, ((d3.max(filteredData, (d: MicroserviceMetricPoint) => d.latencyMs) as number) || 100) * 1.15);
    const yScaleLatency = d3.scaleLinear().domain([0, maxLatency]).range([innerHeight, 0]);

    // Gridlines
    const yGrid = d3
      .axisLeft(yScaleCpu)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat(() => "");

    g.append("g")
      .attr("class", "grid")
      .call(yGrid)
      .selectAll("line")
      .attr("stroke", "#1e293b")
      .attr("stroke-dasharray", "3,3");

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((d) => d3.timeFormat("%H:%M:%S")(d as Date));

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .attr("font-size", "11px")
      .attr("font-family", "monospace");

    g.selectAll(".domain").attr("stroke", "#334155");
    g.selectAll(".tick line").attr("stroke", "#334155");

    // Left Y Axis (CPU %)
    if (metricView === "DUAL" || metricView === "CPU") {
      const yAxisCpu = d3.axisLeft(yScaleCpu).ticks(5).tickFormat((d) => `${d}%`);
      const yGroup = g.append("g").call(yAxisCpu);
      yGroup.selectAll("text").attr("fill", "#38bdf8").attr("font-weight", "600").attr("font-size", "11px");
      yGroup.selectAll("line").attr("stroke", "#334155");

      g.append("text")
        .attr("x", -15)
        .attr("y", -10)
        .attr("fill", "#38bdf8")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .text("CPU %");
    }

    // Right Y Axis (Latency ms)
    if (metricView === "DUAL" || metricView === "LATENCY") {
      const yAxisLat = d3.axisRight(metricView === "LATENCY" ? yScaleCpu : yScaleLatency).ticks(5).tickFormat((d) => `${d}ms`);
      const latPos = metricView === "LATENCY" ? 0 : innerWidth;
      const yLatGroup = g.append("g").attr("transform", `translate(${latPos}, 0)`).call(yAxisLat);
      yLatGroup.selectAll("text").attr("fill", "#a855f7").attr("font-weight", "600").attr("font-size", "11px");
      yLatGroup.selectAll("line").attr("stroke", "#334155");

      g.append("text")
        .attr("x", latPos + 10)
        .attr("y", -10)
        .attr("fill", "#a855f7")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .text("LATENCY");
    }

    // Group data by service
    const grouped = d3.group(filteredData, (d: MicroserviceMetricPoint) => d.serviceId);

    // Color lookup
    const colorMap = new Map(MICROSERVICES.map((s) => [s.id, s.color]));

    // Render curves
    grouped.forEach((svcPoints: MicroserviceMetricPoint[], svcId: string) => {
      const color = colorMap.get(svcId) || "#38bdf8";
      const sortedPoints = [...svcPoints].sort((a: MicroserviceMetricPoint, b: MicroserviceMetricPoint) => a.timestamp.getTime() - b.timestamp.getTime());

      // Line generators
      if (metricView === "DUAL" || metricView === "CPU") {
        const lineCpu = d3
          .line<MicroserviceMetricPoint>()
          .x((d) => xScale(d.timestamp))
          .y((d) => yScaleCpu(d.cpuPercent))
          .curve(d3.curveMonotoneX);

        // Area Gradient
        const areaCpu = d3
          .area<MicroserviceMetricPoint>()
          .x((d) => xScale(d.timestamp))
          .y0(innerHeight)
          .y1((d) => yScaleCpu(d.cpuPercent))
          .curve(d3.curveMonotoneX);

        const gradId = `grad-cpu-${svcId}`;
        const grad = svg
          .append("defs")
          .append("linearGradient")
          .attr("id", gradId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");

        grad.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.22);
        grad.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.0);

        // Render Area
        g.append("path")
          .datum(sortedPoints)
          .attr("fill", `url(#${gradId})`)
          .attr("d", areaCpu as any);

        // Render Line
        g.append("path")
          .datum(sortedPoints)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2.2)
          .attr("d", lineCpu as any);
      }

      if (metricView === "LATENCY") {
        const lineLat = d3
          .line<MicroserviceMetricPoint>()
          .x((d) => xScale(d.timestamp))
          .y((d) => yScaleCpu(d.latencyMs))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(sortedPoints)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,3")
          .attr("d", lineLat as any);
      } else if (metricView === "DUAL") {
        const lineLat = d3
          .line<MicroserviceMetricPoint>()
          .x((d) => xScale(d.timestamp))
          .y((d) => yScaleLatency(d.latencyMs))
          .curve(d3.curveMonotoneX);

        g.append("path")
          .datum(sortedPoints)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "3,3")
          .attr("opacity", 0.75)
          .attr("d", lineLat as any);
      }
    });

    // Crosshair Hover Interactivity
    const overlay = g
      .append("rect")
      .attr("class", "overlay")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .attr("cursor", "crosshair");

    const crosshair = g
      .append("line")
      .attr("class", "crosshair")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("opacity", 0);

    overlay
      .on("mousemove", (event) => {
        const [mouseX] = d3.pointer(event);
        const hoveredDate = xScale.invert(mouseX);

        // Find nearest timestamp
        const timeMap = new Map<number, MicroserviceMetricPoint[]>();
        filteredData.forEach((pt) => {
          const t = pt.timestamp.getTime();
          if (!timeMap.has(t)) timeMap.set(t, []);
          timeMap.get(t)!.push(pt);
        });

        const timeKeys = Array.from(timeMap.keys()).sort((a, b) => a - b);
        if (timeKeys.length === 0) return;

        const targetTime = hoveredDate.getTime();
        const nearestTimeKey = timeKeys.reduce((prev, curr) =>
          Math.abs(curr - targetTime) < Math.abs(prev - targetTime) ? curr : prev
        );

        const snapDate = new Date(nearestTimeKey);
        const snapPoints = timeMap.get(nearestTimeKey) || [];

        crosshair.attr("x1", xScale(snapDate)).attr("x2", xScale(snapDate)).attr("opacity", 1);

        const hoverMetrics = MICROSERVICES.filter((s) => selectedServices[s.id]).map((svc) => {
          const matched = snapPoints.find((p) => p.serviceId === svc.id);
          return {
            service: svc,
            cpu: matched ? matched.cpuPercent : 0,
            latency: matched ? matched.latencyMs : 0,
          };
        });

        setHoveredPoint({ time: snapDate, metrics: hoverMetrics });
      })
      .on("mouseleave", () => {
        crosshair.attr("opacity", 0);
        setHoveredPoint(null);
      });
  }, [data, selectedServices, metricView]);

  // Compute live averages across active services
  const activeServiceList = MICROSERVICES.filter((s) => selectedServices[s.id]);
  const latestTimestampData = data.slice(-MICROSERVICES.length);
  const activeLatest = latestTimestampData.filter((d) => selectedServices[d.serviceId]);

  const avgCpu = activeLatest.length > 0
    ? Math.round(activeLatest.reduce((acc, curr) => acc + curr.cpuPercent, 0) / activeLatest.length)
    : 0;
  const avgLatency = activeLatest.length > 0
    ? Math.round(activeLatest.reduce((acc, curr) => acc + curr.latencyMs, 0) / activeLatest.length)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 my-6 space-y-4">
      {/* Top Header & Live Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Real-Time D3 Microservice Cluster Telemetry</h2>
            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold rounded">
              D3.js SVG Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming CPU utilization (%) and socket latency (ms) time series across all deployed microservices.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isLive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLive ? "Live Stream Active" : "Stream Paused"}
          </button>

          <button
            onClick={triggerTrafficSpike}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 rounded-lg text-xs font-semibold transition"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" /> Inject Load Spike
          </button>

          {/* Metric View Switcher */}
          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg text-[11px] font-semibold">
            {(["DUAL", "CPU", "LATENCY"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMetricView(mode)}
                className={`px-2.5 py-1 rounded transition ${
                  metricView === mode ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {mode === "DUAL" ? "Dual Plot" : mode === "CPU" ? "CPU Only" : "Latency Only"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregate KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CLUSTER AVG CPU</div>
          <div className="text-xl font-bold text-cyan-400 mt-1 flex items-center gap-1">
            <Cpu className="w-4 h-4 text-cyan-400" /> {avgCpu}%
          </div>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SOCKET LATENCY AVG</div>
          <div className="text-xl font-bold text-purple-400 mt-1 flex items-center gap-1">
            <Radio className="w-4 h-4 text-purple-400" /> {avgLatency} ms
          </div>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE SERVICES</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1">
            <Server className="w-4 h-4 text-emerald-400" /> {activeServiceList.length} / {MICROSERVICES.length}
          </div>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TIME WINDOW</div>
          <div className="text-xl font-bold text-slate-200 mt-1 flex items-center gap-1 font-mono">
            <TrendingUp className="w-4 h-4 text-amber-400" /> {timeWindowSeconds}s Window
          </div>
        </div>
      </div>

      {/* Microservice Filter Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Toggle Service Curves:
        </span>
        {MICROSERVICES.map((svc) => {
          const isActive = selectedServices[svc.id];
          return (
            <button
              key={svc.id}
              onClick={() => toggleService(svc.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition ${
                isActive
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-slate-950 border-slate-900 text-slate-600 line-through opacity-50"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: isActive ? svc.color : "#475569" }}
              />
              {svc.name}
            </button>
          );
        })}
      </div>

      {/* D3 Canvas Container & Tooltip Overlay */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 overflow-hidden" ref={containerRef}>
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Hover Crosshair HTML Tooltip Card */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 backdrop-blur-md rounded-lg p-3 text-xs shadow-xl pointer-events-none z-10 w-64 space-y-1.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-400 font-mono text-[10px]">
              <span>HOVER TIMESTAMP</span>
              <span className="text-white font-bold">{d3.timeFormat("%H:%M:%S")(hoveredPoint.time)}</span>
            </div>
            <div className="space-y-1 pt-1">
              {hoveredPoint.metrics.map((m) => (
                <div key={m.service.id} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.service.color }} />
                    <span className="truncate max-w-[110px]">{m.service.name}</span>
                  </div>
                  <div className="font-mono text-right">
                    <span className="text-cyan-400 font-bold">{m.cpu}%</span>
                    <span className="text-slate-500 mx-1">|</span>
                    <span className="text-purple-400">{m.latency}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Notation */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Solid Line: CPU Utilization (%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-purple-400 inline-block" /> Dashed Line: Socket Latency (ms)
          </span>
        </div>
        <div className="font-mono text-slate-500">Auto-refresh rate: 2.5s | Live D3.js Render</div>
      </div>
    </div>
  );
}
