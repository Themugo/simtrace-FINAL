'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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

export default function TelecomDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TelecomDashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch statistics
      const statsRes = await fetch('/api/telecom/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch recent activity
      const activityRes = await fetch('/api/telecom/activity/recent', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const activityData = await activityRes.json();
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Telecom Dashboard</h1>
          <p className="text-green-200 mt-1">Operator: {user?.operator || 'Safaricom'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total SIMs"
            value={stats?.totalSIMs || 0}
            icon="📱"
            color="green"
          />
          <StatCard
            title="Active SIMs"
            value={stats?.activeSIMs || 0}
            icon="✅"
            color="blue"
          />
          <StatCard
            title="Reported Stolen"
            value={stats?.reportedStolen || 0}
            icon="🚨"
            color="red"
          />
          <StatCard
            title="Network Activity"
            value={stats?.networkActivity || 0}
            icon="📊"
            color="purple"
          />
          <StatCard
            title="Triangulations"
            value={stats?.successfulTriangulations || 0}
            icon="📍"
            color="indigo"
          />
          <StatCard
            title="Avg Accuracy"
            value={`${stats?.avgTriangulationAccuracy || 0}m`}
            icon="🎯"
            color="yellow"
          />
          <StatCard
            title="Commission"
            value={`KES ${stats?.totalCommission?.toLocaleString() || 0}`}
            icon="💰"
            color="emerald"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Network Activity</h2>
          </div>
          <div className="p-6">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ActionButton
            title="Register SIM"
            description="Add new SIM card"
            icon="➕"
            href="/telecom/sims/new"
            color="green"
          />
          <ActionButton
            title="Triangulate Device"
            description="Locate device via towers"
            icon="📍"
            href="/telecom/triangulate"
            color="blue"
          />
          <ActionButton
            title="View Cell Towers"
            description="Manage tower network"
            icon="🏗️"
            href="/telecom/towers"
            color="indigo"
          />
          <ActionButton
            title="Commission Report"
            description="View earnings"
            icon="💰"
            href="/telecom/commission"
            color="emerald"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    yellow: 'bg-yellow-500',
    emerald: 'bg-emerald-500',
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

function ActivityCard({ activity }: { activity: RecentActivity }) {
  const typeIcons = {
    call: '📞',
    sms: '💬',
    data: '📶',
    location_update: '📍',
    sim_swap: '🔄',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-4">
        <div className="text-2xl">{typeIcons[activity.type as keyof typeof typeIcons] || '📊'}</div>
        <div>
          <p className="font-semibold text-gray-900">{activity.type.replace('_', ' ').toUpperCase()}</p>
          <p className="text-sm text-gray-600">ICCID: {activity.iccid}</p>
          <p className="text-sm text-gray-500">{activity.details}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">{new Date(activity.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
}

function ActionButton({ title, description, icon, href, color }: { title: string; description: string; icon: string; href: string; color: string }) {
  const colorClasses = {
    green: 'bg-green-600 hover:bg-green-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
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
