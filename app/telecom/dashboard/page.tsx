'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface TelecomDashboardStats {
  totalSIMs: number;
  activeSIMs: number;
  reportedStolen: number;
  networkActivity: number;
  successfulTriangulations: number;
  avgTriangulationAccuracy: number;
  totalCommission: number;
}

interface RecentActivity {
  id: string;
  type: string;
  iccid: string;
  timestamp: string;
  details: string;
}

const STAT_COLOR: Record<string, string> = {
  green: 'var(--emerald)', blue: 'var(--sky)', red: 'var(--rose)',
  purple: 'var(--indigo)', indigo: 'var(--indigo)', yellow: 'var(--amber)', emerald: 'var(--emerald)',
};

const TYPE_ICON: Record<string, string> = {
  call: '📞', sms: '💬', data: '📶', location_update: '📍', sim_swap: '🔄',
};

export default function TelecomDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TelecomDashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // NOTE: same gap as the police dashboard -- these two paths aren't backed
  // by a matching Express route yet (the existing telecomDashboard.ts router
  // is ID/company-scoped, e.g. /api/telecom-dashboard/company/:companyId,
  // not a stateless "my stats" endpoint). api.get() at least fixes the wrong
  // domain/auth-header bugs the previous version had; the real data source
  // still needs a product decision on which backend endpoint this should read.
  const fetchDashboardData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        api.get('/api/telecom/dashboard/stats').catch(() => null),
        api.get('/api/telecom/activity/recent').catch(() => []),
      ]);
      setStats(statsData);
      setRecentActivity(Array.isArray(activityData) ? activityData : []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid var(--border2)', borderTopColor: 'var(--emerald)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', marginBottom: '0.25rem' }}>Telecom Dashboard</h1>
        <p className="text-muted">Operator: {(user as any)?.operator || 'Safaricom'}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard title="Total SIMs"       value={stats?.totalSIMs ?? 0}                                          icon="📱" color="green" />
        <StatCard title="Active SIMs"      value={stats?.activeSIMs ?? 0}                                         icon="✅" color="blue" />
        <StatCard title="Reported Stolen"  value={stats?.reportedStolen ?? 0}                                     icon="🚨" color="red" />
        <StatCard title="Network Activity" value={stats?.networkActivity ?? 0}                                    icon="📊" color="purple" />
        <StatCard title="Triangulations"   value={stats?.successfulTriangulations ?? 0}                           icon="📍" color="indigo" />
        <StatCard title="Avg Accuracy"     value={`${stats?.avgTriangulationAccuracy ?? 0}m`}                     icon="🎯" color="yellow" />
        <StatCard title="Commission"       value={`KES ${(stats?.totalCommission ?? 0).toLocaleString()}`}        icon="💰" color="emerald" />
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Network Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>No recent activity</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        )}
      </div>

      <div className="grid-4">
        <ActionButton title="Register SIM"        description="Add new SIM card"          icon="➕"  href="/telecom/sims/new"     color="emerald" />
        <ActionButton title="Triangulate Device"  description="Locate device via towers"   icon="📍"  href="/telecom/triangulate" color="sky" />
        <ActionButton title="View Cell Towers"    description="Manage tower network"       icon="🏗️" href="/telecom/towers"      color="indigo" />
        <ActionButton title="Commission Report"   description="View earnings"              icon="💰"  href="/telecom/commission"  color="amber" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const c = STAT_COLOR[color] || 'var(--sky)';
  return (
    <div className="stat-card" style={{ ['--accent' as any]: c }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{title}</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.4rem' }}>{value}</p>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: `${c}18`, border: `1px solid ${c}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: RecentActivity }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      padding: '0.9rem 1rem', background: 'var(--surface)', borderRadius: 'var(--r)',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
        <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{TYPE_ICON[activity.type] || '📊'}</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 700 }}>{activity.type.replace('_', ' ').toUpperCase()}</p>
          <p className="text-muted" style={{ fontSize: '0.82rem' }}>ICCID: {activity.iccid}</p>
          <p className="text-muted" style={{ fontSize: '0.78rem' }}>{activity.details}</p>
        </div>
      </div>
      <p className="text-muted" style={{ fontSize: '0.8rem', flexShrink: 0 }}>{new Date(activity.timestamp).toLocaleString()}</p>
    </div>
  );
}

function ActionButton({ title, description, icon, href, color }: { title: string; description: string; icon: string; href: string; color: string }) {
  const c = `var(--${color})`;
  return (
    <Link href={href} className="card card-glow" style={{ display: 'block', textDecoration: 'none', borderLeft: `3px solid ${c}` }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{title}</h3>
      <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>{description}</p>
    </Link>
  );
}
