// Background Evidence Capture Service
import * as TaskManager from 'expo-task-manager';
import * as Camera from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import { store } from '../store';
import { api } from '../api/client';

const EVIDENCE_CAPTURE_TASK_NAME = 'background-evidence-capture-task';

// Define the background task
TaskManager.defineTask(EVIDENCE_CAPTURE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background evidence capture task error:', error);
    return;
  }

  try {
    const { imei, captureInterval } = data as { imei: string; captureInterval: number };
    
    // Check if device is in stolen status
    const deviceStatus = store.getState().devices.status;
    if (deviceStatus !== 'stolen') {
      console.log('Device not stolen, skipping evidence capture');
      return;
    }

    // Capture photo from front camera
    const photo = await captureFrontCameraPhoto();
    
    if (photo) {
      // Upload to backend
      const token = store.getState().auth.token;
      if (token && imei) {
        const formData = new FormData();
        formData.append('photo', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `evidence_${Date.now()}.jpg`,
        } as any);
        formData.append('imei', imei);
        formData.append('timestamp', new Date().toISOString());

        await api.post('/devices/evidence', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Evidence captured and uploaded');
      }
    }

  } catch (err) {
    console.error('Error in evidence capture task:', err);
  }
});

// Capture photo from front camera
async function captureFrontCameraPhoto(): Promise<{ uri: string } | null> {
  try {
    // Check camera permissions
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.error('Camera permission not granted');
      return null;
    }

    // In production, this would use native modules to capture from front camera
    // without showing the camera UI
    // For now, this is a placeholder
    console.log('Evidence capture: front camera photo captured (placeholder)');
    return null;
  } catch (err) {
    console.error('Error capturing evidence photo:', err);
    return null;
  }
}

// Start background evidence capture
export async function startBackgroundEvidenceCapture(imei: string, intervalMinutes: number = 30): Promise<void> {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(EVIDENCE_CAPTURE_TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(EVIDENCE_CAPTURE_TASK_NAME, {
        minimumInterval: intervalMinutes * 60 * 1000,
        stopOnTerminate: false,
        startOnBoot: true,
        delay: 5000, // Delay first capture by 5 seconds
      });
    }

    console.log('Background evidence capture started for IMEI:', imei, 'interval:', intervalMinutes, 'minutes');
  } catch (err) {
    console.error('Error starting background evidence capture:', err);
    throw err;
  }
}

// Stop background evidence capture
export async function stopBackgroundEvidenceCapture(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(EVIDENCE_CAPTURE_TASK_NAME);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(EVIDENCE_CAPTURE_TASK_NAME);
      console.log('Background evidence capture stopped');
    }
  } catch (err) {
    console.error('Error stopping background evidence capture:', err);
    throw err;
  }
}

// Check if evidence capture is running
export async function isEvidenceCaptureRunning(): Promise<boolean> {
  try {
    return await TaskManager.isTaskRegisteredAsync(EVIDENCE_CAPTURE_TASK_NAME);
  } catch (err) {
    console.error('Error checking evidence capture status:', err);
    return false;
  }
}
