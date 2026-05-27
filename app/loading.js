import SimTraceLogo from "../components/SimTraceLogo";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingTop: "1rem" }}>
      {/* Logo pulse */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: 0.6 }}>
        <SimTraceLogo size={28} showText={false} />
        <div style={{ height: 16, width: 120, background: "var(--border)", borderRadius: 6, animation: "shimmer 1.5s infinite" }} />
      </div>

      {/* KPI skeleton row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.75rem" }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ background: "var(--bg2)", border: "1px solid #1e2d45", borderRadius: 12, padding: "1.1rem", height: 90 }}>
            <div style={{ height: 10, width: "60%", background: "var(--border)", borderRadius: 4, marginBottom: 12, animation: "shimmer 1.5s infinite" }} />
            <div style={{ height: 28, width: "40%", background: "var(--border)", borderRadius: 4, animation: "shimmer 1.5s infinite" }} />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[100, 80, 120].map((h, i) => (
            <div key={i} style={{ background: "var(--bg2)", border: "1px solid #1e2d45", borderRadius: 12, height: h, animation: "shimmer 1.5s infinite" }} />
          ))}
        </div>
        <div style={{ background: "var(--bg2)", border: "1px solid #1e2d45", borderRadius: 12, height: 320, animation: "shimmer 1.5s infinite" }} />
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { opacity: 1; }
          50%  { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
