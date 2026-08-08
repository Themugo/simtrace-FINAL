// Background Location Tracking Service
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { store } from '../store';
import { api } from '../api/client';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  try {
    const { imei } = data as { imei: string };
    
    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Send location to backend
    const token = store.getState().auth.token;
    if (token && imei) {
      await api.post('/track', {
        imei,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Device-Key': store.getState().devices.deviceKey,
        },
      });
    }

    console.log('Background location sent:', location.coords);
  } catch (err) {
    console.error('Error sending background location:', err);
  }
});

// Start background location tracking
export async function startBackgroundLocationTracking(imei: string): Promise<void> {
  try {
    // Request background location permissions
    const { status: existingStatus } = await Location.getBackgroundPermissionsAsync();
    if (existingStatus !== 'granted') {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Background location permission not granted');
      }
    }

    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 100, // 100 meters
        showsAlert: false,
      });
    }

    console.log('Background location tracking started for IMEI:', imei);
  } catch (err) {
    console.error('Error starting background location tracking:', err);
    throw err;
  }
}

// Stop background location tracking
export async function stopBackgroundLocationTracking(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('Background location tracking stopped');
    }
  } catch (err) {
    console.error('Error stopping background location tracking:', err);
    throw err;
  }
}

// Check if background location is running
export async function isBackgroundLocationRunning(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  } catch (err) {
    console.error('Error checking background location status:', err);
    return false;
  }
}
