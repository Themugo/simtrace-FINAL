/**
 * SIMTRACE™ Enterprise Design Tokens
 * Harmonized design tokens drawing inspiration from Stripe (precision), Apple (minimal elegance & blur),
 * Notion (typography & structural clarity), and Linear (keyboard density & dark cyber aesthetic).
 */

export type SimTraceModule =
  | 'device-dna'
  | 'operations'
  | 'police'
  | 'guardian'
  | 'imei'
  | 'financial'
  | 'analytics'
  | 'compliance'
  | 'recovery'
  | 'developer';

export interface ModuleTheme {
  id: SimTraceModule;
  name: string;
  primaryHex: string;
  primaryDimHex: string;
  bgGlow: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
}

export const MODULE_THEMES: Record<SimTraceModule, ModuleTheme> = {
  'device-dna': {
    id: 'device-dna',
    name: 'Device DNA & Hardware Registry',
    primaryHex: '#38bdf8', // Sky Cyan
    primaryDimHex: '#0ea5e9',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    badgeText: '#38bdf8',
    borderAccent: 'rgba(56, 189, 248, 0.4)',
  },
  operations: {
    id: 'operations',
    name: 'GEOINT & Field Operations',
    primaryHex: '#34d399', // Emerald Green
    primaryDimHex: '#10b981',
    bgGlow: 'rgba(52, 211, 153, 0.15)',
    badgeBg: 'rgba(52, 211, 153, 0.12)',
    badgeText: '#34d399',
    borderAccent: 'rgba(52, 211, 153, 0.4)',
  },
  police: {
    id: 'police',
    name: 'Law Enforcement & Police Portal',
    primaryHex: '#818cf8', // Indigo Royal
    primaryDimHex: '#6366f1',
    bgGlow: 'rgba(129, 140, 248, 0.15)',
    badgeBg: 'rgba(129, 140, 248, 0.12)',
    badgeText: '#818cf8',
    borderAccent: 'rgba(129, 140, 248, 0.4)',
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian AI Intelligence',
    primaryHex: '#fbbf24', // Amber Gold
    primaryDimHex: '#f59e0b',
    bgGlow: 'rgba(251, 191, 36, 0.15)',
    badgeBg: 'rgba(251, 191, 36, 0.12)',
    badgeText: '#fbbf24',
    borderAccent: 'rgba(251, 191, 36, 0.4)',
  },
  imei: {
    id: 'imei',
    name: 'IMEI Registry & Telecom Interconnect',
    primaryHex: '#fb7185', // Electric Rose
    primaryDimHex: '#f43f5e',
    bgGlow: 'rgba(251, 113, 133, 0.15)',
    badgeBg: 'rgba(251, 113, 133, 0.12)',
    badgeText: '#fb7185',
    borderAccent: 'rgba(251, 113, 133, 0.4)',
  },
  financial: {
    id: 'financial',
    name: 'M-Pesa SCP & Financial Clearance',
    primaryHex: '#00a651', // M-Pesa Green
    primaryDimHex: '#008742',
    bgGlow: 'rgba(0, 166, 81, 0.15)',
    badgeBg: 'rgba(0, 166, 81, 0.12)',
    badgeText: '#00a651',
    borderAccent: 'rgba(0, 166, 81, 0.4)',
  },
  analytics: {
    id: 'analytics',
    name: 'Executive Analytics & BI',
    primaryHex: '#c084fc', // Purple Amethyst
    primaryDimHex: '#a855f7',
    bgGlow: 'rgba(192, 132, 252, 0.15)',
    badgeBg: 'rgba(192, 132, 252, 0.12)',
    badgeText: '#c084fc',
    borderAccent: 'rgba(192, 132, 252, 0.4)',
  },
  compliance: {
    id: 'compliance',
    name: 'Trust Center & Regulatory Compliance',
    primaryHex: '#2dd4bf', // Teal Cyber
    primaryDimHex: '#14b8a6',
    bgGlow: 'rgba(45, 212, 191, 0.15)',
    badgeBg: 'rgba(45, 212, 191, 0.12)',
    badgeText: '#2dd4bf',
    borderAccent: 'rgba(45, 212, 191, 0.4)',
  },
  recovery: {
    id: 'recovery',
    name: 'Stolen Device Recovery Network',
    primaryHex: '#f97316', // Flame Orange
    primaryDimHex: '#ea580c',
    bgGlow: 'rgba(249, 115, 22, 0.15)',
    badgeBg: 'rgba(249, 115, 22, 0.12)',
    badgeText: '#f97316',
    borderAccent: 'rgba(249, 115, 22, 0.4)',
  },
  developer: {
    id: 'developer',
    name: 'Developer APIs & Blockchain Ledger',
    primaryHex: '#a78bfa', // Violet Hex
    primaryDimHex: '#8b5cf6',
    bgGlow: 'rgba(167, 139, 250, 0.15)',
    badgeBg: 'rgba(167, 139, 250, 0.12)',
    badgeText: '#a78bfa',
    borderAccent: 'rgba(167, 139, 250, 0.4)',
  },
};

export const DESIGN_TOKENS = {
  colors: {
    bg: '#0c0e14',
    bgElevated: '#12151f',
    surface: '#181c28',
    card: '#1c2030',
    border: '#252a3a',
    borderSubtle: '#2e3548',
    borderFocus: '#38bdf8',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textDim: '#3d4a5c',
  },
  typography: {
    fontSans: "'Inter', system-ui, -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    scale: {
      xs: '0.75rem',  // 12px
      sm: '0.85rem',  // 13.6px
      base: '0.95rem',// 15.2px
      md: '1.05rem',  // 16.8px
      lg: '1.25rem',  // 20px
      xl: '1.5rem',   // 24px
      '2xl': '1.85rem',// 29.6px
      '3xl': '2.25rem',// 36px
    },
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.4)',
    md: '0 4px 16px rgba(0,0,0,0.5)',
    lg: '0 8px 40px rgba(0,0,0,0.6)',
    glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  blur: {
    sm: 'blur(4px)',
    md: 'blur(12px)',
    lg: 'blur(24px)',
  },
  motion: {
    fast: '0.15s cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    slow: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },
};
