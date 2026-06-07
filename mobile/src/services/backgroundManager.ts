// Background Services Manager
// Coordinates all background services for the mobile app
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  isBackgroundLocationRunning,
} from './backgroundLocationTracking';
import {
  startBackgroundSIMDetection,
  stopBackgroundSIMDetection,
  isSIMDetectionRunning,
} from './backgroundSIMDetection';
import {
  startBackgroundEvidenceCapture,
  stopBackgroundEvidenceCapture,
  isEvidenceCaptureRunning,
} from './backgroundEvidenceCapture';
import {
  activatePanicMode,
  deactivatePanicMode,
  isPanicModeActive,
} from './backgroundPanicMode';

export interface BackgroundServicesConfig {
  imei: string;
  enableLocationTracking?: boolean;
  enableSIMDetection?: boolean;
  enableEvidenceCapture?: boolean;
  evidenceCaptureInterval?: number; // minutes
}

export class BackgroundServicesManager {
  private imei: string | null = null;
  private locationTrackingEnabled = false;
  private simDetectionEnabled = false;
  private evidenceCaptureEnabled = false;

  // Initialize background services for a device
  async initialize(config: BackgroundServicesConfig): Promise<void> {
    this.imei = config.imei;

    try {
      // Start location tracking if enabled
      if (config.enableLocationTracking !== false) {
        await startBackgroundLocationTracking(config.imei);
        this.locationTrackingEnabled = true;
      }

      // Start SIM detection if enabled
      if (config.enableSIMDetection !== false) {
        await startBackgroundSIMDetection(config.imei);
        this.simDetectionEnabled = true;
      }

      // Start evidence capture if enabled
      if (config.enableEvidenceCapture) {
        await startBackgroundEvidenceCapture(
          config.imei,
          config.evidenceCaptureInterval || 30
        );
        this.evidenceCaptureEnabled = true;
      }

      console.log('Background services initialized for IMEI:', config.imei);
    } catch (err) {
      console.error('Error initializing background services:', err);
      throw err;
    }
  }

  // Stop all background services
  async stopAll(): Promise<void> {
    try {
      if (this.locationTrackingEnabled) {
        await stopBackgroundLocationTracking();
        this.locationTrackingEnabled = false;
      }

      if (this.simDetectionEnabled) {
        await stopBackgroundSIMDetection();
        this.simDetectionEnabled = false;
      }

      if (this.evidenceCaptureEnabled) {
        await stopBackgroundEvidenceCapture();
        this.evidenceCaptureEnabled = false;
      }

      console.log('All background services stopped');
    } catch (err) {
      console.error('Error stopping background services:', err);
      throw err;
    }
  }

  // Update configuration
  async updateConfig(config: Partial<BackgroundServicesConfig>): Promise<void> {
    if (!this.imei) {
      throw new Error('Background services not initialized');
    }

    try {
      // Location tracking
      if (config.enableLocationTracking !== undefined) {
        if (config.enableLocationTracking && !this.locationTrackingEnabled) {
          await startBackgroundLocationTracking(this.imei);
          this.locationTrackingEnabled = true;
        } else if (!config.enableLocationTracking && this.locationTrackingEnabled) {
          await stopBackgroundLocationTracking();
          this.locationTrackingEnabled = false;
        }
      }

      // SIM detection
      if (config.enableSIMDetection !== undefined) {
        if (config.enableSIMDetection && !this.simDetectionEnabled) {
          await startBackgroundSIMDetection(this.imei);
          this.simDetectionEnabled = true;
        } else if (!config.enableSIMDetection && this.simDetectionEnabled) {
          await stopBackgroundSIMDetection();
          this.simDetectionEnabled = false;
        }
      }

      // Evidence capture
      if (config.enableEvidenceCapture !== undefined) {
        if (config.enableEvidenceCapture && !this.evidenceCaptureEnabled) {
          await startBackgroundEvidenceCapture(
            this.imei,
            config.evidenceCaptureInterval || 30
          );
          this.evidenceCaptureEnabled = true;
        } else if (!config.enableEvidenceCapture && this.evidenceCaptureEnabled) {
          await stopBackgroundEvidenceCapture();
          this.evidenceCaptureEnabled = false;
        }
      }

      console.log('Background services configuration updated');
    } catch (err) {
      console.error('Error updating background services config:', err);
      throw err;
    }
  }

  // Get status of all services
  async getStatus(): Promise<{
    locationTracking: boolean;
    simDetection: boolean;
    evidenceCapture: boolean;
    panicMode: boolean;
  }> {
    return {
      locationTracking: await isBackgroundLocationRunning(),
      simDetection: await isSIMDetectionRunning(),
      evidenceCapture: await isEvidenceCaptureRunning(),
      panicMode: isPanicModeActive(),
    };
  }

  // Activate panic mode (overrides normal operation)
  async activatePanic(): Promise<void> {
    if (!this.imei) {
      throw new Error('Background services not initialized');
    }

    await activatePanicMode(this.imei);
  }

  // Deactivate panic mode
  async deactivatePanic(): Promise<void> {
    await deactivatePanicMode();
  }
}

// Singleton instance
export const backgroundServicesManager = new BackgroundServicesManager();
