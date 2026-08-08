// screens/telecom/TelecomDashboardScreen.tsx - Telecom dashboard screen
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getTelecomStatistics, getNetworkActivity, triangulateDevice } from '../../api/telecom';
import PremiumStatsCard from '../../components/PremiumStatsCard';
import PremiumButton from '../../components/PremiumButton';

interface TelecomStats {
  totalSIMs: number;
  activeSIMs: number;
  reportedStolen: number;
  successfulTriangulations: number;
}

export default function TelecomDashboardScreen() {
  const [stats, setStats] = useState<TelecomStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsData = await getTelecomStatistics();
      setStats(statsData);

      // Load recent network activity
      // const activityData = await getNetworkActivity(iccid);
      // setRecentActivity(activityData.activities);
    } catch (error) {
      console.error('Error loading telecom dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriangulate = async (imei: string) => {
    try {
      const result = await triangulateDevice({ imei });
      console.log('Triangulation result:', result);
    } catch (error) {
      console.error('Triangulation error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Telecom Dashboard</Text>
        <Text style={styles.headerSubtitle}>Monitor SIM and network activity</Text>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <PremiumStatsCard
          title="Total SIMs"
          value={stats?.totalSIMs || 0}
          trend="+15%"
          icon="📱"
          gradientColors={['#10B981', '#059669']}
        />
        <PremiumStatsCard
          title="Active SIMs"
          value={stats?.activeSIMs || 0}
          trend="+8%"
          icon="✅"
          gradientColors={['#3B82F6', '#2563EB']}
        />
        <PremiumStatsCard
          title="Reported Stolen"
          value={stats?.reportedStolen || 0}
          trend="-3%"
          icon="⚠️"
          gradientColors={['#EF4444', '#DC2626']}
        />
        <PremiumStatsCard
          title="Triangulations"
          value={stats?.successfulTriangulations || 0}
          trend="+20%"
          icon="📍"
          gradientColors={['#8B5CF6', '#7C3AED']}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Network Activity</Text>
        {recentActivity.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          recentActivity.map((activity) => (
            <View key={activity._id} style={styles.activityCard}>
              <Text style={styles.activityType}>{activity.activityType}</Text>
              <Text style={styles.activityDestination}>{activity.destination || 'N/A'}</Text>
              <Text style={styles.activityTimestamp}>{new Date(activity.timestamp).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.actionsContainer}>
        <PremiumButton
          title="Register SIM"
          onPress={() => {}}
          gradientColors={['#10B981', '#059669']}
        />
        <PremiumButton
          title="Triangulate Device"
          onPress={() => {}}
          gradientColors={['#8B5CF6', '#7C3AED']}
        />
        <PremiumButton
          title="View Cell Towers"
          onPress={() => {}}
          gradientColors={['#3B82F6', '#2563EB']}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D1FAE5',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  activityDestination: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  activityTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
});
