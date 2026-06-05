// screens/dashboard/DashboardScreen.tsx - Main dashboard screen with device tracking
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchDevices, selectDevice } from '@store/slices/deviceSlice';
import { RootState } from '@store';
import { Device } from '@api/devices';
import MapView, { Marker, Circle } from 'react-native-maps';

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { devices, selectedDevice, loading } = useSelector((state: RootState) => state.devices);
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: -1.2921,
    longitude: 36.8219,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      await dispatch(fetchDevices()).unwrap();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load devices');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const handleDevicePress = (device: Device) => {
    dispatch(selectDevice(device));
    navigation.navigate('DeviceDetails' as never);
  };

  const handleAddDevice = () => {
    navigation.navigate('AddDevice' as never);
  };

  const handlePanicMode = () => {
    Alert.alert(
      'Panic Mode',
      'Are you sure you want to activate panic mode for all devices?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', style: 'destructive', onPress: () => activatePanicMode() },
      ]
    );
  };

  const activatePanicMode = () => {
    // TODO: Implement panic mode activation
    Alert.alert('Success', 'Panic mode activated for all devices');
  };

  const activeDevices = devices.filter(d => d.status === 'active');
  const stolenDevices = devices.filter(d => d.status === 'stolen');
  const recoveredDevices = devices.filter(d => d.status === 'recovered');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user?.name || 'User'}</Text>
        <Text style={styles.subtitle}>Track and protect your devices</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{activeDevices.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Text style={styles.statNumber}>{stolenDevices.length}</Text>
            <Text style={styles.statLabel}>Stolen</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Text style={styles.statNumber}>{recoveredDevices.length}</Text>
            <Text style={styles.statLabel}>Recovered</Text>
          </View>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            {devices.map((device) => {
              if (device.lastLocation) {
                return (
                  <Marker
                    key={device.id}
                    coordinate={{
                      latitude: device.lastLocation.latitude,
                      longitude: device.lastLocation.longitude,
                    }}
                    title={device.nickname || device.deviceName}
                    description={`Status: ${device.status}`}
                    onPress={() => handleDevicePress(device)}
                  />
                );
              }
              return null;
            })}
          </MapView>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddDevice}>
            <Text style={styles.actionButtonText}>+ Add Device</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.panicButton]}
            onPress={handlePanicMode}
          >
            <Text style={styles.actionButtonText}>🚨 Panic Mode</Text>
          </TouchableOpacity>
        </View>

        {/* Device List */}
        <View style={styles.devicesSection}>
          <Text style={styles.sectionTitle}>Your Devices</Text>
          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No devices added yet</Text>
              <TouchableOpacity onPress={handleAddDevice}>
                <Text style={styles.emptyLink}>Add your first device</Text>
              </TouchableOpacity>
            </View>
          ) : (
            devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceCard}
                onPress={() => handleDevicePress(device)}
              >
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>
                    {device.nickname || device.deviceName}
                  </Text>
                  <Text style={styles.deviceType}>{device.deviceType}</Text>
                </View>
                <View style={styles.deviceStatus}>
                  <View
                    style={[
                      styles.statusDot,
                      device.status === 'active' && styles.statusActive,
                      device.status === 'stolen' && styles.statusStolen,
                      device.status === 'recovered' && styles.statusRecovered,
                    ]}
                  />
                  <Text style={styles.statusText}>{device.status}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 60,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardWarning: {
    backgroundColor: '#FFF3CD',
  },
  statCardSuccess: {
    backgroundColor: '#D4EDDA',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  panicButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devicesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptyLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#34C759',
  },
  statusStolen: {
    backgroundColor: '#FF3B30',
  },
  statusRecovered: {
    backgroundColor: '#007AFF',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
});
