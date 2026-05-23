export default function SimTraceLogo({ size = 40, showText = true, textSize = "1.15rem" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <svg width={size} height={size * 1.1} viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lg-shield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af"/>
            <stop offset="50%" stopColor="var(--indigo)"/>
            <stop offset="100%" stopColor="var(--sky)"/>
          </linearGradient>
          <linearGradient id="lg-inner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--bg)"/>
            <stop offset="100%" stopColor="var(--surface)"/>
          </linearGradient>
          <linearGradient id="lg-sim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8"/>
            <stop offset="100%" stopColor="#0284c7"/>
          </linearGradient>
          <linearGradient id="lg-s" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa"/>
            <stop offset="100%" stopColor="var(--sky)"/>
          </linearGradient>
          <filter id="lg-glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="lg-glowS">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Outer glow */}
        <ellipse cx="100" cy="90" rx="68" ry="68" fill="var(--indigo)" opacity="0.12"/>
        {/* Shield */}
        <path d="M100 8 L168 35 L168 90 Q168 145 100 175 Q32 145 32 90 L32 35 Z" fill="url(#lg-shield)" filter="url(#lg-glow)"/>
        <path d="M100 16 L162 41 L162 90 Q162 140 100 168 Q38 140 38 90 L38 41 Z" fill="url(#lg-inner)"/>
        {/* Radar rings */}
        <circle cx="100" cy="90" r="42" stroke="var(--indigo)" strokeWidth="1.2" fill="none" opacity="0.7"/>
        <circle cx="100" cy="90" r="28" stroke="var(--sky)" strokeWidth="0.8" fill="none" opacity="0.5"/>
        {/* Cross hairs */}
        <line x1="100" y1="52" x2="100" y2="128" stroke="#1d4ed8" strokeWidth="0.7" opacity="0.5"/>
        <line x1="62"  y1="90" x2="138" y2="90"  stroke="#1d4ed8" strokeWidth="0.7" opacity="0.5"/>
        {/* SIM card */}
        <g transform="rotate(-8, 68, 80)">
          <rect x="44" y="55" width="36" height="48" rx="4" fill="url(#lg-sim)" filter="url(#lg-glow)"/>
          <rect x="50" y="66" width="24" height="18" rx="2" fill="#d97706"/>
          <line x1="58" y1="66" x2="58" y2="84" stroke="#b45309" strokeWidth="0.5"/>
          <line x1="66" y1="66" x2="66" y2="84" stroke="#b45309" strokeWidth="0.5"/>
          <line x1="50" y1="72" x2="74" y2="72" stroke="#b45309" strokeWidth="0.5"/>
          <line x1="50" y1="78" x2="74" y2="78" stroke="#b45309" strokeWidth="0.5"/>
          <polygon points="44,55 54,55 54,62 44,62" fill="var(--bg)"/>
        </g>
        {/* Circuit traces */}
        <path d="M56 80 L30 80 L30 95 L22 95" stroke="var(--sky)" strokeWidth="1.2" fill="none" opacity="0.7" strokeDasharray="2,2"/>
        <circle cx="22" cy="95" r="2" fill="var(--sky)" opacity="0.8"/>
        <path d="M56 72 L28 72 L28 60 L18 60" stroke="var(--sky)" strokeWidth="0.8" fill="none" opacity="0.5" strokeDasharray="2,2"/>
        <circle cx="18" cy="60" r="1.5" fill="var(--sky)" opacity="0.6"/>
        {/* S */}
        <text x="100" y="110" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900"
              fontSize="52" fill="url(#lg-s)" filter="url(#lg-glowS)" letterSpacing="-2">S</text>
        {/* Pin */}
        <g transform="translate(148, 55)" filter="url(#lg-glow)">
          <circle cx="0" cy="0" r="8" fill="var(--sky)"/>
          <circle cx="0" cy="0" r="4" fill="var(--bg)"/>
          <path d="M0 8 L0 16" stroke="var(--sky)" strokeWidth="2" strokeLinecap="round"/>
        </g>
      </svg>

      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: textSize, fontWeight: 900, letterSpacing: "0.05em", color: "#fff" }}>
            SIM<span style={{ color: "var(--sky)" }}>TRACE</span>
            <sup style={{ fontSize: "0.45em", color: "var(--muted)", verticalAlign: "super", marginLeft: "1px" }}>™</sup>
          </div>
          <div style={{ fontSize: "0.5em", letterSpacing: "0.2em", color: "var(--dim)", marginTop: "1px" }}>
            CONNECT · PROTECT · RECOVER
          </div>
        </div>
      )}
    </div>
  );
}
