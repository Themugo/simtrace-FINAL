// screens/devices/DeviceTrackingScreen.tsx - Device tracking screen with live location
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { locationTrackingService } from '../../services/locationTracking';
import { deviceKeyStorageService } from '../../services/deviceKeyStorage';
import { deviceService } from '../../api/devices';

interface DeviceTrackingScreenProps {
  route: {
    params: {
      deviceId: string;
      imei: string;
      deviceKey: string;
    };
  };
}

export default function DeviceTrackingScreen({ route }: DeviceTrackingScreenProps) {
  const { deviceId, imei, deviceKey } = route.params;
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationHistory, setLocationHistory] = useState<Array<{
    latitude: number;
    longitude: number;
    timestamp: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<{
    isTracking: boolean;
    hasPermissions: boolean;
    deviceKey: string | null;
  }>({ isTracking: false, hasPermissions: false, deviceKey: null });

  useEffect(() => {
    // Store device key securely
    deviceKeyStorageService.storeDeviceKey(deviceKey);
    
    // Check initial tracking status
    checkTrackingStatus();

    // Get initial location
    getInitialLocation();

    // Load location history
    loadLocationHistory();

    return () => {
      // Cleanup when component unmounts
      if (isTracking) {
        locationTrackingService.stopTracking();
      }
    };
  }, []);

  const checkTrackingStatus = async () => {
    const status = await locationTrackingService.getTrackingStatus();
    setTrackingStatus(status);
    setIsTracking(status.isTracking);
  };

  const getInitialLocation = async () => {
    setLoading(true);
    try {
      const location = await locationTrackingService.getCurrentLocation();
      if (location) {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting initial location:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocationHistory = async () => {
    try {
      const history = await deviceService.getDeviceLocation(deviceId);
      if (history) {
        setLocationHistory([{
          latitude: history.latitude,
          longitude: history.longitude,
          timestamp: new Date(history.timestamp).getTime(),
        }]);
      }
    } catch (error) {
      console.error('Error loading location history:', error);
    }
  };

  const toggleTracking = async () => {
    if (isTracking) {
      // Stop tracking
      const success = await locationTrackingService.stopTracking();
      if (success) {
        setIsTracking(false);
        Alert.alert('Tracking Stopped', 'Device tracking has been disabled');
      }
    } else {
      // Start tracking
      setLoading(true);
      const success = await locationTrackingService.startTracking(deviceKey);
      setLoading(false);
      
      if (success) {
        setIsTracking(true);
        Alert.alert('Tracking Started', 'Device tracking has been enabled');
      } else {
        Alert.alert('Error', 'Failed to start tracking. Please check permissions.');
      }
    }
    
    // Update status
    checkTrackingStatus();
  };

  const refreshLocation = async () => {
    setLoading(true);
    try {
      const location = await locationTrackingService.getCurrentLocation();
      if (location) {
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        Alert.alert('Location Updated', 'Current location has been refreshed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Tracking</Text>
        <Text style={styles.subtitle}>IMEI: {imei}</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {currentLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {currentLocation && (
            <Marker
              coordinate={currentLocation}
              title="Current Location"
              description="Device last known location"
            />
          )}
          {locationHistory.length > 1 && (
            <Polyline
              coordinates={locationHistory}
              strokeColor="#007AFF"
              strokeWidth={2}
            />
          )}
        </MapView>
      )}

      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Tracking Status</Text>
          <Text style={[
            styles.statusValue,
            { color: isTracking ? '#4CAF50' : '#FF9800' }
          ]}>
            {isTracking ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Permissions</Text>
          <Text style={[
            styles.statusValue,
            { color: trackingStatus.hasPermissions ? '#4CAF50' : '#F44336' }
          ]}>
            {trackingStatus.hasPermissions ? 'Granted' : 'Denied'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={toggleTracking}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={refreshLocation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Tracking Information</Text>
        <Text style={styles.infoText}>
          Location tracking uses GPS to continuously update device location.
          Enable tracking to monitor device movement in real-time.
        </Text>
        <Text style={styles.warningText}>
          ⚠️ Tracking consumes battery. Disable when not needed.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  map: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 8,
  },
});
