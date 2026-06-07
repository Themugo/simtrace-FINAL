'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

export default function PoliceDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PoliceDashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch statistics
      const statsRes = await fetch('/api/police/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch recent reports
      const reportsRes = await fetch('/api/police/reports/recent', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const reportsData = await reportsRes.json();
      setRecentReports(reportsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Police Dashboard</h1>
          <p className="text-blue-200 mt-1">Station: {user?.station || 'Nairobi Central'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Reports"
            value={stats?.totalReports || 0}
            icon="📋"
            color="blue"
          />
          <StatCard
            title="Open Cases"
            value={stats?.openCases || 0}
            icon="🔍"
            color="yellow"
          />
          <StatCard
            title="Closed Cases"
            value={stats?.closedCases || 0}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Recovery Rate"
            value={`${stats?.recoveryRate || 0}%`}
            icon="📈"
            color="purple"
          />
          <StatCard
            title="Active Alerts"
            value={stats?.activeAlerts || 0}
            icon="🚨"
            color="red"
          />
          <StatCard
            title="Active Stations"
            value={stats?.stationsActive || 0}
            icon="🏢"
            color="indigo"
          />
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Reports</h2>
          </div>
          <div className="p-6">
            {recentReports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent reports</p>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionButton
            title="File New Report"
            description="Create a new theft report"
            icon="➕"
            href="/police/reports/new"
            color="blue"
          />
          <ActionButton
            title="Search IMEI"
            description="Check device status"
            icon="🔎"
            href="/imei"
            color="green"
          />
          <ActionButton
            title="View Alerts"
            description="Active nationwide alerts"
            icon="🚨"
            href="/police/alerts"
            color="red"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${colorClasses[color as keyof typeof colorClasses]} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: RecentReport }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    investigating: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">{report.reportNumber}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[report.status as keyof typeof statusColors]}`}>
            {report.status}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">IMEI: {report.imei}</p>
        <p className="text-sm text-gray-500">{report.station}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">{new Date(report.incidentDate).toLocaleDateString()}</p>
        <a
          href={`/police/reports/${report.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 block"
        >
          View Details →
        </a>
      </div>
    </div>
  );
}

function ActionButton({ title, description, icon, href, color }: { title: string; description: string; icon: string; href: string; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <a
      href={href}
      className={`${colorClasses[color as keyof typeof colorClasses]} text-white rounded-lg p-6 block hover:shadow-lg transition-shadow`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm opacity-90 mt-1">{description}</p>
    </a>
  );
}
