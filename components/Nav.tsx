'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef, CSSProperties } from 'react';
import SimTraceLogo from './SimTraceLogo';

export default function Nav() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [adminMenu, setAdminMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMobileOpen(false); setAdminMenu(false); }, [pathname]);

  // Lock background scroll while the mobile drawer is open, and let Escape
  // close it (and the admin dropdown) -- neither worked before.
  useEffect(() => {
    if (mobileOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [mobileOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setMobileOpen(false); setAdminMenu(false); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handler(e: globalThis.MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setAdminMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const token = localStorage.getItem('simtrace_token');
    const fetch_ = () => {
      fetch(`${BASE}/api/alerts/unread-count`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        .then(r => r.json()).then(d => setUnreadCount(d.count || 0)).catch(() => {});
    };
    fetch_();
    const iv = setInterval(fetch_, 60000);
    return () => clearInterval(iv);
  }, [user]);

  function handleLogout() { logout(); router.push('/'); }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const linkStyle = (href: string): CSSProperties => ({
    color: isActive(href) ? 'var(--sky)' : 'var(--text2)',
    fontWeight: isActive(href) ? 600 : 400,
    fontSize: '0.88rem',
    textDecoration: 'none',
    padding: '4px 2px',
    borderBottom: `2px solid ${isActive(href) ? 'var(--sky)' : 'transparent'}`,
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
  });

  const adminLinks = [
    { href: '/dashboard', label: '🗺️  Command Centre' },
    { href: '/alerts', label: '🔔  Alerts' },
    { href: '/admin/ads', label: '💰  Revenue & Ads' },
    { href: '/admin/revenue', label: '📊  Revenue Chart' },
    { href: '/admin/users', label: '👥  Users' },
    { href: '/admin/devices', label: '📱  All Devices' },
    { href: '/law-enforcement', label: '🏛️  Law Enforcement' },
  ];

  const userLinks = [
    { href: '/imei', label: 'IMEI Check', show: true },
    { href: '/devices', label: 'My Devices', show: !!user },
    { href: '/alerts', label: 'Alerts', show: !!user },
    { href: '/report', label: 'Report', show: !!user },
    { href: '/community', label: 'Community', show: true },
    { href: '/pricing', label: 'Pricing', show: true },
    { href: '/ai-assistant', label: 'AI Chat', show: !!user },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60,
        background: scrolled ? 'rgba(12,14,20,0.98)' : 'rgba(12,14,20,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        display: 'flex', alignItems: 'center',
        padding: '0 max(1.25rem, env(safe-area-inset-right)) 0 max(1.25rem, env(safe-area-inset-left))',
        transition: 'background 0.2s, border-color 0.2s',
        gap: '1.5rem',
      }}>
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <SimTraceLogo size={32} textSize="0.95rem" />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }} className="nav-desktop">
          {userLinks.filter(l => l.show).map(l => (
            <Link key={l.href} href={l.href} style={linkStyle(l.href)}>
              {l.label}
              {l.href === '/alerts' && unreadCount > 0 && (
                <span style={{ marginLeft: 4, background: 'var(--rose)', color: '#fff', borderRadius: 10, fontSize: '0.6rem', padding: '1px 5px', fontWeight: 700, verticalAlign: 'middle' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto', flexShrink: 0 }} className="nav-desktop">
          {user?.role === 'admin' && (
            <div ref={adminRef} style={{ position: 'relative' }}>
              <button onClick={() => setAdminMenu(m => !m)}
                style={{ background: adminMenu ? 'var(--surface)' : 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 'var(--r)', padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
                ⚡ Admin
                <span style={{ fontSize: '0.65rem', opacity: 0.6, transform: adminMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
              </button>
              {adminMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
                  minWidth: 200, padding: '0.35rem',
                  boxShadow: 'var(--shadow-lg)', animation: 'scaleIn 0.15s ease',
                  transformOrigin: 'top right',
                }}>
                  {adminLinks.map(l => (
                    <Link key={l.href} href={l.href} onClick={() => setAdminMenu(false)}
                      style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem', color: isActive(l.href) ? 'var(--sky)' : 'var(--text2)', textDecoration: 'none', borderRadius: 'var(--r)', fontSize: '0.85rem', background: isActive(l.href) ? 'var(--surface)' : 'transparent', transition: 'background 0.1s' }}
                      onMouseOver={e => { if (!isActive(l.href)) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                      onMouseOut={e => { if (!isActive(l.href)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !user && (
            <>
              <Link href="/login" style={{ ...linkStyle('/login'), border: 'none' }}>Log in</Link>
              <Link href="/register" className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', textDecoration: 'none' }}>
                Get Started
              </Link>
            </>
          )}

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link href="/profile" style={{ textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--sky-dim),var(--indigo-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#fff', cursor: 'pointer' }} title={user.name}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
              <button onClick={handleLogout}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.82rem', padding: '4px 8px' }}>
                Sign out
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(o => !o)}
          className="nav-hamburger"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="nav-mobile-drawer"
          style={{
            background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)',
            borderRadius: 'var(--r)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
            marginLeft: 'auto', width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </nav>

      {mobileOpen && (
        <div
          id="nav-mobile-drawer"
          className="nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onClick={() => setMobileOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{
            position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
            background: 'var(--bg)', borderTop: '1px solid var(--border)',
            overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            padding: '0.75rem max(0.75rem, env(safe-area-inset-right)) max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left))',
            display: 'flex', flexDirection: 'column', gap: '2px',
            animation: 'slideIn 0.2s ease',
          }}>
            {userLinks.filter(l => l.show).map(l => (
              <Link key={l.href} href={l.href}
                style={{ display: 'flex', alignItems: 'center', padding: '0.8rem 0.75rem', borderRadius: 'var(--r)', color: isActive(l.href) ? 'var(--sky)' : 'var(--text2)', textDecoration: 'none', fontWeight: isActive(l.href) ? 600 : 400, background: isActive(l.href) ? 'var(--surface)' : 'transparent', fontSize: '0.95rem' }}>
                {l.label}
                {l.href === '/alerts' && unreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--rose)', color: '#fff', borderRadius: 10, fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}>{unreadCount}</span>
                )}
              </Link>
            ))}

            {user?.role === 'admin' && (
              <>
                <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--dim)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 0.75rem 0.4rem' }}>Admin</div>
                  {adminLinks.map(l => (
                    <Link key={l.href} href={l.href}
                      style={{ display: 'block', padding: '0.7rem 0.75rem', borderRadius: 'var(--r)', color: isActive(l.href) ? 'var(--sky)' : 'var(--text2)', textDecoration: 'none', fontSize: '0.9rem', background: isActive(l.href) ? 'var(--surface)' : 'transparent' }}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </>
            )}

            <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.75rem' }}>
              {!user ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '0.75rem', border: '1px solid var(--border2)', borderRadius: 'var(--r)', color: 'var(--text2)', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
                  <Link href="/register" className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '0.75rem', textDecoration: 'none', justifyContent: 'center' }}>Get Started</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
                  <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'var(--text2)', fontSize: '0.9rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--sky-dim),var(--indigo-dim))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    {user.name}
                  </Link>
                  <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', borderRadius: 'var(--r)', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' }}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-hamburger { display: none !important; }
        @media (max-width: 768px) {
          .nav-desktop  { display: none !important; }
          .nav-hamburger{ display: block !important; }
        }
      `}</style>
    </>
  );
}
