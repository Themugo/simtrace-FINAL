'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface PoliceDashboardStats {
  totalReports: number;
  openCases: number;
  closedCases: number;
  recoveryRate: number;
  activeAlerts: number;
  stationsActive: number;
}

interface RecentReport {
  id: string;
  reportNumber: string;
  imei: string;
  incidentDate: string;
  status: string;
  station: string;
}

const STAT_COLOR: Record<string, string> = {
  blue: 'var(--sky)', yellow: 'var(--amber)', green: 'var(--emerald)',
  purple: 'var(--indigo)', red: 'var(--rose)', indigo: 'var(--indigo)',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warn', investigating: 'badge-info', resolved: 'badge-ok', closed: 'badge-muted',
};

export default function PoliceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PoliceDashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // NOTE: these two endpoints are not yet backed by a matching route on the
  // Express API (the closest existing routes -- /api/police-integration/stats,
  // /api/police-hierarchy/stats -- are admin-only and won't work for a station-
  // level law-enforcement user). Using api.get() at least fixes the wrong
  // domain/auth-header bugs the previous version had; the real data source
  // still needs a product decision on which backend endpoint this should read.
  const fetchDashboardData = async () => {
    try {
      const [statsData, reportsData] = await Promise.all([
        api.get('/api/police/dashboard/stats').catch(() => null),
        api.get('/api/police/reports/recent').catch(() => []),
      ]);
      setStats(statsData);
      setRecentReports(Array.isArray(reportsData) ? reportsData : []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid var(--border2)', borderTopColor: 'var(--sky)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', marginBottom: '0.25rem' }}>Police Dashboard</h1>
        <p className="text-muted">Station: {(user as any)?.station || 'Nairobi Central'}</p>
      </div>

      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <StatCard title="Total Reports"    value={stats?.totalReports ?? 0}          icon="📋" color="blue" />
        <StatCard title="Open Cases"       value={stats?.openCases ?? 0}             icon="🔍" color="yellow" />
        <StatCard title="Closed Cases"     value={stats?.closedCases ?? 0}           icon="✅" color="green" />
        <StatCard title="Recovery Rate"    value={`${stats?.recoveryRate ?? 0}%`}    icon="📈" color="purple" />
        <StatCard title="Active Alerts"    value={stats?.activeAlerts ?? 0}          icon="🚨" color="red" />
        <StatCard title="Active Stations"  value={stats?.stationsActive ?? 0}        icon="🏢" color="indigo" />
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recent Reports</h2>
        {recentReports.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>No recent reports</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentReports.map((report) => <ReportCard key={report.id} report={report} />)}
          </div>
        )}
      </div>

      <div className="grid-3">
        <ActionButton title="File New Report" description="Create a new theft report" icon="➕" href="/police/reports/new" color="sky" />
        <ActionButton title="Search IMEI"     description="Check device status"       icon="🔎" href="/imei" color="emerald" />
        <ActionButton title="View Alerts"     description="Active nationwide alerts"  icon="🚨" href="/police/alerts" color="rose" />
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
          <p style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.4rem' }}>{value}</p>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `${c}18`, border: `1px solid ${c}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: RecentReport }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      padding: '0.9rem 1rem', background: 'var(--surface)', borderRadius: 'var(--r)',
      flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>{report.reportNumber}</span>
          <span className={`badge ${STATUS_BADGE[report.status] || 'badge-muted'}`}>{report.status}</span>
        </div>
        <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>IMEI: {report.imei}</p>
        <p className="text-muted" style={{ fontSize: '0.78rem' }}>{report.station}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>{new Date(report.incidentDate).toLocaleDateString()}</p>
        <Link href={`/police/reports/${report.id}`} style={{ color: 'var(--sky)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
          View Details →
        </Link>
      </div>
    </div>
  );
}

function ActionButton({ title, description, icon, href, color }: { title: string; description: string; icon: string; href: string; color: string }) {
  const c = `var(--${color})`;
  return (
    <Link href={href} className="card card-glow" style={{ display: 'block', textDecoration: 'none', borderLeft: `3px solid ${c}` }}>
      <div style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{title}</h3>
      <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{description}</p>
    </Link>
  );
}
