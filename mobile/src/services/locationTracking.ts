// services/locationTracking.ts - Background location tracking service
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { apiClient } from '../api/client';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  timestamp: number;
  deviceKey: string;
}

class LocationTrackingService {
  private isTracking: boolean = false;
  private deviceKey: string | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;

  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      return foregroundStatus === 'granted' && backgroundStatus === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Start location tracking
  async startTracking(deviceKey: string): Promise<boolean> {
    if (this.isTracking) {
      console.log('Location tracking already active');
      return true;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      console.error('Location permissions not granted');
      return false;
    }

    this.deviceKey = deviceKey;
    this.isTracking = true;

    // Start foreground location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: LOCATION_UPDATE_INTERVAL,
      distanceInterval: 10, // meters
      showsBackgroundLocationIndicator: true,
    });

    // Also set up periodic updates for better reliability
    this.startPeriodicUpdates();

    console.log('Location tracking started');
    return true;
  }

  // Stop location tracking
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      console.log('Location tracking not active');
      return;
    }

    this.isTracking = false;
    this.deviceKey = null;

    // Stop location updates
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

    // Clear periodic updates
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }

    console.log('Location tracking stopped');
  }

  // Start periodic location updates
  private startPeriodicUpdates(): void {
    this.locationUpdateInterval = setInterval(async () => {
      if (!this.isTracking || !this.deviceKey) return;

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        await this.sendLocationUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          speed: location.coords.speed,
          timestamp: Date.now(),
          deviceKey: this.deviceKey,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }, LOCATION_UPDATE_INTERVAL);
  }

  // Send location update to backend
  private async sendLocationUpdate(locationData: LocationData): Promise<void> {
    try {
      await apiClient.post('/track', {
        imei: locationData.deviceKey,
        lat: locationData.latitude,
        lng: locationData.longitude,
        accuracy: locationData.accuracy,
        altitude: locationData.altitude,
        speed: locationData.speed,
        ts: new Date(locationData.timestamp).toISOString(),
      });
      console.log('Location update sent successfully');
    } catch (error) {
      console.error('Error sending location update:', error);
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Check if tracking is active
  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  // Get tracking status
  async getTrackingStatus(): Promise<{
    isTracking: boolean;
    hasPermissions: boolean;
    deviceKey: string | null;
  }> {
    const hasPermissions = await Location.getBackgroundPermissionsAsync()
      .then(status => status.granted)
      .catch(() => false);

    return {
      isTracking: this.isTracking,
      hasPermissions,
      deviceKey: this.deviceKey,
    };
  }
}

// Register background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    if (locations && locations.length > 0) {
      const location = locations[0];
      console.log('Background location update:', location);
      
      // Send to backend
      try {
        await apiClient.post('/track', {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy,
          ts: new Date(location.timestamp).toISOString(),
        });
      } catch (error) {
        console.error('Error sending background location:', error);
      }
    }
  }
});

// Singleton instance
export const locationTrackingService = new LocationTrackingService();
export default locationTrackingService;
