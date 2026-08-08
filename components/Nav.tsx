'use client';

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import SimTraceLogo from './SimTraceLogo';
import {
  Shield,
  Smartphone,
  LifeBuoy,
  Building2,
  BookOpen,
  ChevronDown,
  Radio,
  User,
  LogOut,
  Zap,
  CheckCircle2,
  Activity,
  Layers,
  Code,
  Landmark,
  Handshake,
  AlertTriangle,
  FileText,
  Lock,
  Search,
  Sparkles,
  MapPin,
  Camera,
  X,
  Menu
} from 'lucide-react';

export default function Nav() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Navigation Dropdown states
  const [openDropdown, setOpenDropdown] = useState<'security' | 'devices' | 'recovery' | 'business' | 'resources' | 'admin' | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Lock body scroll during mobile menu
  useEffect(() => {
    if (mobileOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [mobileOpen]);

  // Keyboard shortcut (Escape closes dropdowns / mobile drawer)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setOpenDropdown(null);
        setStatusModalOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Handle scroll threshold for background contrast
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: globalThis.MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread alert count if user is authenticated
  useEffect(() => {
    if (!user) return;
    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('simtrace_token') : null;
    const fetch_ = () => {
      fetch(`${BASE}/api/alerts/unread-count`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(r => r.json())
        .then(d => setUnreadCount(d.count || 0))
        .catch(() => {});
    };
    fetch_();
    const iv = setInterval(fetch_, 60000);
    return () => clearInterval(iv);
  }, [user]);

  function handleLogout() {
    logout();
    router.push('/');
  }

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  // Nav Dropdown configurations
  const securitySublinks = [
    { href: '/imei', title: 'IMEI Intelligence', desc: 'Verify blacklists, GSMA registry & identity', icon: Search, color: '#38bdf8' },
    { href: '/alerts', title: 'SIM Threat Detection', desc: 'SS7 SIM swap alerts & network anomalies', icon: AlertTriangle, color: '#f43f5e' },
    { href: '/guardian', title: 'Guardian Safety', desc: 'Proactive geofence defense for family & assets', icon: Shield, color: '#3b82f6' },
    { href: '/intelligence', title: 'Risk Intelligence', desc: 'AI anti-cloning & fraud scoring engine', icon: Sparkles, color: '#6366f1' },
  ];

  const devicesSublinks = [
    { href: '/devices', title: 'My Devices', desc: 'View, monitor, and configure protected assets', icon: Smartphone, color: '#38bdf8' },
    { href: '/imei', title: 'IMEI Check Console', desc: 'Instant 15-digit hardware audit query', icon: Search, color: '#10b981' },
    { href: '/intelligence', title: 'Device Intelligence', desc: 'Hardware DNA & behavioral anomaly scoring', icon: Sparkles, color: '#6366f1' },
    { href: '/blockchain-ledger', title: 'Ownership & History', desc: 'Immutable blockchain ownership registry', icon: Layers, color: '#a855f7' },
    { href: '/sdk', title: 'Forensic SDK Integration', desc: 'Integration guide for SIMTRACE forensic SDK & telemetry', icon: Code, color: '#38bdf8' },
  ];

  const recoverySublinks = [
    { href: '/report', title: 'Report Lost / Stolen', desc: 'Initiate emergency remote lock & tracking', icon: AlertTriangle, color: '#f43f5e' },
    { href: '/cases', title: 'My Recovery Cases', desc: 'Track active incident investigation telemetry', icon: MapPin, color: '#10b981' },
    { href: '/evidence', title: 'Digital Evidence Vault', desc: 'Forensic camera snapshots & chain-of-custody', icon: Camera, color: '#a855f7' },
    { href: '/recovery-network', title: 'Recovery Mesh Network', desc: '1,420 community nodes & field dispatch', icon: Radio, color: '#f59e0b' },
  ];

  const businessSublinks = [
    { href: '/advertise', title: 'Commercial Hub', desc: 'Pre-trade-in device verification for retailers', icon: Building2, color: '#38bdf8' },
    { href: '/imei', title: 'Bulk Device Audit', desc: 'Verify inventory blacklists before purchase', icon: Search, color: '#10b981' },
    { href: '/marketplace', title: 'Verified Marketplace', desc: 'Trade & sell 100% verified clean hardware', icon: Smartphone, color: '#a855f7' },
    { href: '/telecom-analytics', title: 'Business Intelligence', desc: 'Carrier risk analytics & market insights', icon: Activity, color: '#f59e0b' },
  ];

  const resourcesSublinks = {
    platform: [
      { href: '/operations', label: 'Operations Command Center', icon: Activity },
      { href: '/police/dashboard', label: 'Government & Police Portal', icon: Landmark },
      { href: '/partners', label: 'Telecom & Network Partners', icon: Handshake },
      { href: '/ecosystem', label: 'Ecosystem Topology Map', icon: Layers },
    ],
    developers: [
      { href: '/developer', label: 'API & Developer Portal', icon: Code },
      { href: '/docs', label: 'Documentation & SDKs', icon: FileText },
    ],
    learn: [
      { href: '/trust-platform', label: 'Global Trust Platform', icon: Shield },
      { href: '/pricing', label: 'Network Pricing & Plans', icon: BookOpen },
    ]
  };

  const adminLinks = [
    { href: '/dashboard', label: '🗺️ Command Center' },
    { href: '/alerts', label: '🔔 Live System Alerts' },
    { href: '/admin/ads', label: '💰 Commercial & Ads' },
    { href: '/admin/users', label: '👥 User Registry' },
    { href: '/admin/devices', label: '📱 All Managed Devices' },
    { href: '/admin/design-system', label: '🎨 Platform Design System' },
  ];

  return (
    <>
      <nav
        ref={navRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          backgroundColor: scrolled ? 'rgba(7, 13, 27, 0.95)' : 'rgba(7, 13, 27, 0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${scrolled ? '#1e293b' : 'rgba(30, 41, 59, 0.5)'}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 max(1.25rem, env(safe-area-inset-right)) 0 max(1.25rem, env(safe-area-inset-left))',
          transition: 'background-color 0.2s, border-color 0.2s',
        }}
      >
        <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '1rem' }}>
          
          {/* Brand Area (Left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', shrink: 0 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <SimTraceLogo size={34} showText={false} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    SIMTRACE<sup style={{ fontSize: '0.6rem', color: '#38bdf8', fontWeight: 400 }}>™</sup>
                  </span>
                  <span style={{
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '4px',
                    padding: '1px 5px',
                  }}>
                    NETWORK
                  </span>
                </div>
                <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#94a3b8', letterSpacing: '0.12em', fontWeight: 600 }}>
                  CONNECT · PROTECT · RECOVER
                </span>
              </div>
            </Link>
          </div>

          {/* Primary Navigation (Center - Exactly 5 items: Security, Devices, Recovery, Business, Resources) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1.5rem', flex: 1 }} className="nav-desktop">
            
            {/* 1. Security */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDropdown('security')} onMouseLeave={() => setOpenDropdown(null)}>
              <Link
                href="/capabilities"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive('/capabilities') ? 700 : 600,
                  color: isActive('/capabilities') ? '#38bdf8' : '#e2e8f0',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: openDropdown === 'security' || isActive('/capabilities') ? 'rgba(30, 41, 59, 0.6)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span>Security</span>
                <ChevronDown size={12} style={{ opacity: 0.6, transform: openDropdown === 'security' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </Link>

              {openDropdown === 'security' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '320px',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '8px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 200,
                    animation: 'fadeIn 0.15s ease-out',
                  }}
                >
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, padding: '6px 10px', letterSpacing: '0.05em' }}>
                    SECURITY MODULES
                  </div>
                  {securitySublinks.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: '#e2e8f0',
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: `${sub.color}15`, color: sub.color, shrink: 0, marginTop: '2px' }}>
                          <SubIcon size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{sub.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sub.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Devices */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDropdown('devices')} onMouseLeave={() => setOpenDropdown(null)}>
              <Link
                href="/devices"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive('/devices') ? 700 : 600,
                  color: isActive('/devices') ? '#38bdf8' : '#e2e8f0',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: openDropdown === 'devices' || isActive('/devices') ? 'rgba(30, 41, 59, 0.6)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span>Devices</span>
                <ChevronDown size={12} style={{ opacity: 0.6, transform: openDropdown === 'devices' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </Link>

              {openDropdown === 'devices' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '320px',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '8px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 200,
                  }}
                >
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, padding: '6px 10px', letterSpacing: '0.05em' }}>
                    DEVICE MANAGEMENT
                  </div>
                  {devicesSublinks.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: '#e2e8f0',
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: `${sub.color}15`, color: sub.color, shrink: 0, marginTop: '2px' }}>
                          <SubIcon size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{sub.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sub.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Recovery */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDropdown('recovery')} onMouseLeave={() => setOpenDropdown(null)}>
              <Link
                href="/cases"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive('/cases') || isActive('/report') ? 700 : 600,
                  color: isActive('/cases') || isActive('/report') ? '#38bdf8' : '#e2e8f0',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: openDropdown === 'recovery' || isActive('/cases') ? 'rgba(30, 41, 59, 0.6)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span>Recovery</span>
                <ChevronDown size={12} style={{ opacity: 0.6, transform: openDropdown === 'recovery' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </Link>

              {openDropdown === 'recovery' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '320px',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '8px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 200,
                  }}
                >
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, padding: '6px 10px', letterSpacing: '0.05em' }}>
                    RECOVERY WORKFLOW
                  </div>
                  {recoverySublinks.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: '#e2e8f0',
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: `${sub.color}15`, color: sub.color, shrink: 0, marginTop: '2px' }}>
                          <SubIcon size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{sub.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sub.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Business */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDropdown('business')} onMouseLeave={() => setOpenDropdown(null)}>
              <Link
                href="/advertise"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: isActive('/advertise') || isActive('/marketplace') ? 700 : 600,
                  color: isActive('/advertise') || isActive('/marketplace') ? '#38bdf8' : '#e2e8f0',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: openDropdown === 'business' || isActive('/advertise') ? 'rgba(30, 41, 59, 0.6)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span>Business</span>
                <ChevronDown size={12} style={{ opacity: 0.6, transform: openDropdown === 'business' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </Link>

              {openDropdown === 'business' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '320px',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '8px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 200,
                  }}
                >
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 700, padding: '6px 10px', letterSpacing: '0.05em' }}>
                    COMMERCIAL & ENTERPRISE
                  </div>
                  {businessSublinks.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: '#e2e8f0',
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.12s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: `${sub.color}15`, color: sub.color, shrink: 0, marginTop: '2px' }}>
                          <SubIcon size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{sub.title}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sub.desc}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Resources (Dropdown) */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDropdown('resources')} onMouseLeave={() => setOpenDropdown(null)}>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'resources' ? null : 'resources')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  background: openDropdown === 'resources' ? 'rgba(30, 41, 59, 0.6)' : 'transparent',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span>Resources</span>
                <ChevronDown size={12} style={{ opacity: 0.6, transform: openDropdown === 'resources' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {openDropdown === 'resources' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '380px',
                    backgroundColor: '#0B132B',
                    border: '1px solid #1e293b',
                    borderRadius: '16px',
                    padding: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    zIndex: 200,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700, padding: '4px 6px', letterSpacing: '0.05em' }}>
                      PLATFORM
                    </div>
                    {resourcesSublinks.platform.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setOpenDropdown(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: '#cbd5e1',
                            fontSize: '0.78rem',
                            fontWeight: 500,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <SubIcon size={13} style={{ color: '#38bdf8' }} />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700, padding: '4px 6px', letterSpacing: '0.05em' }}>
                        DEVELOPERS
                      </div>
                      {resourcesSublinks.developers.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setOpenDropdown(null)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: '#cbd5e1',
                              fontSize: '0.78rem',
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <SubIcon size={13} style={{ color: '#a855f7' }} />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700, padding: '4px 6px', letterSpacing: '0.05em' }}>
                        LEARN
                      </div>
                      {resourcesSublinks.learn.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setOpenDropdown(null)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: '#cbd5e1',
                              fontSize: '0.78rem',
                              fontWeight: 500,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <SubIcon size={13} style={{ color: '#10b981' }} />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Side Controls: Network Status & Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto', shrink: 0 }} className="nav-desktop">
            
            {/* Status Indicator */}
            <button
              type="button"
              onClick={() => setStatusModalOpen(s => !s)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Click to view Network Status"
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} className="animate-pulse" />
              <span>NETWORK OPERATIONAL</span>
            </button>

            {/* Admin Menu Dropdown (if role === admin) */}
            {user?.role === 'admin' && (
              <div style={{ position: 'relative' }} onMouseEnter={() => setOpenDropdown('admin')} onMouseLeave={() => setOpenDropdown(null)}>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#fbbf24',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={12} />
                  <span>Admin</span>
                  <ChevronDown size={10} />
                </button>

                {openDropdown === 'admin' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      width: '210px',
                      backgroundColor: '#0B132B',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      padding: '6px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      zIndex: 200,
                    }}
                  >
                    {adminLinks.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpenDropdown(null)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons */}
            {!loading && !user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link
                  href="/login"
                  style={{
                    color: '#cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'color 0.15s',
                  }}
                >
                  Log in
                </Link>

                <Link
                  href="/register"
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    padding: '6px 16px',
                    borderRadius: '10px',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
                >
                  Get Started
                </Link>
              </div>
            )}

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Link href="/profile" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0284c7, #2563EB)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      color: '#ffffff',
                      cursor: 'pointer',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                    }}
                    title={user.name || 'User Profile'}
                  >
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    padding: '4px 10px',
                    borderRadius: '8px',
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="nav-hamburger"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#f8fafc',
              borderRadius: '10px',
              cursor: 'pointer',
              marginLeft: 'auto',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#070D1B',
            zIndex: 99,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Mobile Status Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '10px 12px', backgroundColor: '#0B132B', border: '1px solid #1e293b', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>NETWORK OPERATIONAL</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>24/7 ACTIVE</span>
          </div>

          {/* Mobile 5 Main Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            
            {/* Security */}
            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <div
                onClick={() => setMobileExpandedSection(mobileExpandedSection === 'sec' ? null : 'sec')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', cursor: 'pointer', color: '#f8fafc', fontWeight: 700 }}
              >
                <Link href="/capabilities" style={{ color: '#f8fafc', textDecoration: 'none' }}>Security</Link>
                <ChevronDown size={16} style={{ transform: mobileExpandedSection === 'sec' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {mobileExpandedSection === 'sec' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', marginTop: '4px' }}>
                  {securitySublinks.map(s => (
                    <Link key={s.href} href={s.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', padding: '4px 0' }}>{s.title}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Devices */}
            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <div
                onClick={() => setMobileExpandedSection(mobileExpandedSection === 'dev' ? null : 'dev')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', cursor: 'pointer', color: '#f8fafc', fontWeight: 700 }}
              >
                <Link href="/devices" style={{ color: '#f8fafc', textDecoration: 'none' }}>Devices</Link>
                <ChevronDown size={16} style={{ transform: mobileExpandedSection === 'dev' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {mobileExpandedSection === 'dev' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', marginTop: '4px' }}>
                  {devicesSublinks.map(s => (
                    <Link key={s.href} href={s.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', padding: '4px 0' }}>{s.title}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recovery */}
            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <div
                onClick={() => setMobileExpandedSection(mobileExpandedSection === 'rec' ? null : 'rec')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', cursor: 'pointer', color: '#f8fafc', fontWeight: 700 }}
              >
                <Link href="/cases" style={{ color: '#f8fafc', textDecoration: 'none' }}>Recovery</Link>
                <ChevronDown size={16} style={{ transform: mobileExpandedSection === 'rec' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {mobileExpandedSection === 'rec' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', marginTop: '4px' }}>
                  {recoverySublinks.map(s => (
                    <Link key={s.href} href={s.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', padding: '4px 0' }}>{s.title}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Business */}
            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <div
                onClick={() => setMobileExpandedSection(mobileExpandedSection === 'biz' ? null : 'biz')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', cursor: 'pointer', color: '#f8fafc', fontWeight: 700 }}
              >
                <Link href="/advertise" style={{ color: '#f8fafc', textDecoration: 'none' }}>Business</Link>
                <ChevronDown size={16} style={{ transform: mobileExpandedSection === 'biz' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {mobileExpandedSection === 'biz' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', marginTop: '4px' }}>
                  {businessSublinks.map(s => (
                    <Link key={s.href} href={s.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', padding: '4px 0' }}>{s.title}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Resources */}
            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem' }}>
              <div
                onClick={() => setMobileExpandedSection(mobileExpandedSection === 'res' ? null : 'res')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', cursor: 'pointer', color: '#f8fafc', fontWeight: 700 }}
              >
                <span>Resources</span>
                <ChevronDown size={16} style={{ transform: mobileExpandedSection === 'res' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {mobileExpandedSection === 'res' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px', marginTop: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>PLATFORM</div>
                  {resourcesSublinks.platform.map(s => (
                    <Link key={s.href} href={s.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem' }}>{s.label}</Link>
                  ))}
                  <div style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 700, marginTop: '4px' }}>DEVELOPERS</div>
                  {resourcesSublinks.developers.map(s => (
                    <Link key={s.href} href={s.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem' }}>{s.label}</Link>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Mobile Auth Actions */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
            {!user ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  href="/login"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#2563EB',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: '#e2e8f0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>View Profile</div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155', color: '#94a3b8', background: 'transparent', cursor: 'pointer' }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Network Status Drawer Modal */}
      {statusModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            right: 20,
            width: '320px',
            backgroundColor: '#0B132B',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            zIndex: 250,
            fontSize: '0.8rem',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid #1e293b', pb: '10px', mb: '10px' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>SIMTRACE NETWORK STATUS</span>
            <button onClick={() => setStatusModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#cbd5e1' }}>
            <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
              <span>● Core SS7 Services</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>Operational</span>
            </div>
            <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
              <span>● Device Intelligence</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>Operational</span>
            </div>
            <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
              <span>● Recovery Network</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>Operational</span>
            </div>
            <div style={{ display: 'flex', justifyBetween: 'space-between' }}>
              <span>● Developer API</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>Operational</span>
            </div>
          </div>
          <div style={{ marginTop: '12px', pt: '8px', borderTop: '1px solid #1e293b', fontSize: '0.68rem', color: '#64748b', textAlign: 'right' }}>
            Last checked: Just now
          </div>
        </div>
      )}

      {/* Helper CSS for Navbar Desktop/Mobile breakpoints */}
      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-hamburger { display: none !important; }
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// Helper icon wrapper component
function ShieldAlertIcon(props: any) {
  return <Shield {...props} />;
}
