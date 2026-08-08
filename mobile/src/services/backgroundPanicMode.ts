// Background Panic Mode Service
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Vibration from 'expo-vibration';
import * as Notifications from 'expo-notifications';
import { store } from '../store';
import { api } from '../api/client';

const PANIC_MODE_TASK_NAME = 'background-panic-mode-task';

// Define the background task
TaskManager.defineTask(PANIC_MODE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background panic mode task error:', error);
    return;
  }

  try {
    const { imei } = data as { imei: string };
    
    // Check if panic mode is active
    const isPanicMode = store.getState().devices.panicMode;
    if (!isPanicMode) {
      return;
    }

    // Send high-priority location update
    const location = await getCurrentLocation();
    
    const token = store.getState().auth.token;
    if (token && imei && location) {
      await api.post('/track', {
        imei,
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy,
        panicMode: true,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Device-Key': store.getState().devices.deviceKey,
        },
      });

      // Send panic alert to backend
      await api.post('/alerts', {
        imei,
        type: 'panic_mode',
        payload: {
          location,
          timestamp: new Date().toISOString(),
        },
        narrative: 'PANIC MODE ACTIVATED - Immediate assistance required',
        priority: 'critical',
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Vibrate device
    await Vibration.vibrate([500, 200, 500]);

    // Show notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'PANIC MODE ACTIVE',
        body: 'Your location is being shared with emergency services',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null,
    });

  } catch (err) {
    console.error('Error in panic mode task:', err);
  }
});

// Get current location
async function getCurrentLocation() {
  try {
    const location = await import('expo-location');
    const currentLocation = await location.Location.getCurrentPositionAsync({
      accuracy: location.Location.Accuracy.High,
    });
    return {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      accuracy: currentLocation.coords.accuracy,
    };
  } catch (err) {
    console.error('Error getting location:', err);
    return null;
  }
}

// Activate panic mode
export async function activatePanicMode(imei: string): Promise<void> {
  try {
    // Update store
    store.dispatch({
      type: 'devices/setPanicMode',
      payload: { active: true, activatedAt: new Date().toISOString() },
    });

    // Start background task
    const isRegistered = await TaskManager.isTaskRegisteredAsync(PANIC_MODE_TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(PANIC_MODE_TASK_NAME, {
        minimumInterval: 10 * 1000, // 10 seconds
        stopOnTerminate: false,
        startOnBoot: true,
        delay: 0,
      });
    }

    // Send immediate panic alert
    const token = store.getState().auth.token;
    if (token && imei) {
      await api.post('/devices/panic', {
        imei,
        active: true,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    console.log('Panic mode activated for IMEI:', imei);
  } catch (err) {
    console.error('Error activating panic mode:', err);
    throw err;
  }
}

// Deactivate panic mode
export async function deactivatePanicMode(): Promise<void> {
  try {
    // Update store
    store.dispatch({
      type: 'devices/setPanicMode',
      payload: { active: false, deactivatedAt: new Date().toISOString() },
    });

    // Stop background task
    const isRegistered = await TaskManager.isTaskRegisteredAsync(PANIC_MODE_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(PANIC_MODE_TASK_NAME);
    }

    // Send deactivation alert
    const imei = store.getState().devices.currentDeviceIMEI;
    const token = store.getState().auth.token;
    if (token && imei) {
      await api.post('/devices/panic', {
        imei,
        active: false,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    console.log('Panic mode deactivated');
  } catch (err) {
    console.error('Error deactivating panic mode:', err);
    throw err;
  }
}

// Check if panic mode is active
export function isPanicModeActive(): boolean {
  return store.getState().devices.panicMode;
}
