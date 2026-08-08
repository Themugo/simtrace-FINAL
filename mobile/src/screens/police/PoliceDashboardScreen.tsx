// screens/police/PoliceDashboardScreen.tsx - Police dashboard screen
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPoliceStatistics, getPoliceReportsByStation, createNationwideAlert } from '../../api/police';
import PremiumStatsCard from '../../components/PremiumStatsCard';
import PremiumButton from '../../components/PremiumButton';

interface PoliceStats {
  totalReports: number;
  openCases: number;
  closedCases: number;
  recoveryRate: number;
}

export default function PoliceDashboardScreen() {
  const [stats, setStats] = useState<PoliceStats | null>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const statsData = await getPoliceStatistics();
      setStats(statsData);

      // Load recent reports (assuming station ID is available)
      // const reportsData = await getPoliceReportsByStation(stationId);
      // setRecentReports(reportsData.reports);
    } catch (error) {
      console.error('Error loading police dashboard:', error);
    } finally {
      setLoading(false);
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
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Police Dashboard</Text>
        <Text style={styles.headerSubtitle}>Monitor and manage cases</Text>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <PremiumStatsCard
          title="Total Reports"
          value={stats?.totalReports || 0}
          trend="+12%"
          icon="📋"
          gradientColors={['#10B981', '#059669']}
        />
        <PremiumStatsCard
          title="Open Cases"
          value={stats?.openCases || 0}
          trend="+5%"
          icon="🔍"
          gradientColors={['#F59E0B', '#D97706']}
        />
        <PremiumStatsCard
          title="Closed Cases"
          value={stats?.closedCases || 0}
          trend="+8%"
          icon="✅"
          gradientColors={['#3B82F6', '#2563EB']}
        />
        <PremiumStatsCard
          title="Recovery Rate"
          value={`${stats?.recoveryRate || 0}%`}
          trend="+2%"
          icon="📈"
          gradientColors={['#8B5CF6', '#7C3AED']}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {recentReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent reports</Text>
          </View>
        ) : (
          recentReports.map((report) => (
            <View key={report._id} style={styles.reportCard}>
              <Text style={styles.reportNumber}>{report.reportNumber}</Text>
              <Text style={styles.reportIMEI}>IMEI: {report.imei}</Text>
              <Text style={styles.reportStatus}>{report.status}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.actionsContainer}>
        <PremiumButton
          title="Create Alert"
          onPress={() => {}}
          gradientColors={['#EF4444', '#DC2626']}
        />
        <PremiumButton
          title="View Cases"
          onPress={() => {}}
          gradientColors={['#4F46E5', '#4338CA']}
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
    color: '#E0E7FF',
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
  reportCard: {
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
  reportNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  reportIMEI: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  reportStatus: {
    fontSize: 14,
    color: '#4F46E5',
    marginTop: 4,
    fontWeight: '600',
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
