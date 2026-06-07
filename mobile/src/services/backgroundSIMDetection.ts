// Background SIM Change Detection Service
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { store } from '../store';
import { api } from '../api/client';

const SIM_DETECTION_TASK_NAME = 'background-sim-detection-task';

// Define the background task
TaskManager.defineTask(SIM_DETECTION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background SIM detection task error:', error);
    return;
  }

  try {
    const { imei } = data as { imei: string };
    
    // Get current SIM info (platform-specific implementation needed)
    // For now, this is a placeholder - actual implementation requires native modules
    const currentSIMInfo = await getCurrentSIMInfo();
    
    const previousSIMInfo = store.getState().devices.lastSIMInfo;
    
    // Check for SIM change
    if (previousSIMInfo && currentSIMInfo.iccid !== previousSIMInfo.iccid) {
      console.warn('SIM swap detected!', {
        previous: previousSIMInfo.iccid,
        current: currentSIMInfo.iccid,
      });

      // Send alert to backend
      const token = store.getState().auth.token;
      if (token && imei) {
        await api.post('/alerts', {
          imei,
          type: 'sim_swap',
          payload: {
            previousIccid: previousSIMInfo.iccid,
            newIccid: currentSIMInfo.iccid,
            timestamp: new Date().toISOString(),
          },
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    }

    // Update stored SIM info
    store.dispatch({
      type: 'devices/updateLastSIMInfo',
      payload: currentSIMInfo,
    });

  } catch (err) {
    console.error('Error in SIM detection task:', err);
  }
});

// Placeholder for getting SIM info
// This would require native modules for actual implementation
async function getCurrentSIMInfo(): Promise<{ iccid: string; imsi: string; msisdn: string }> {
  // In production, this would use native modules to get actual SIM info
  // For now, return placeholder data
  return {
    iccid: 'placeholder_iccid',
    imsi: 'placeholder_imsi',
    msisdn: 'placeholder_msisdn',
  };
}

// Start background SIM detection
export async function startBackgroundSIMDetection(imei: string): Promise<void> {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(SIM_DETECTION_TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(SIM_DETECTION_TASK_NAME, {
        minimumInterval: 15 * 60 * 1000, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }

    console.log('Background SIM detection started for IMEI:', imei);
  } catch (err) {
    console.error('Error starting background SIM detection:', err);
    throw err;
  }
}

// Stop background SIM detection
export async function stopBackgroundSIMDetection(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(SIM_DETECTION_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(SIM_DETECTION_TASK_NAME);
      console.log('Background SIM detection stopped');
    }
  } catch (err) {
    console.error('Error stopping background SIM detection:', err);
    throw err;
  }
}

// Check if SIM detection is running
export async function isSIMDetectionRunning(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(SIM_DETECTION_TASK_NAME);
  } catch (err) {
    console.error('Error checking SIM detection status:', err);
    return false;
  }
}
