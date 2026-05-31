// ── Recovery & Alert Engine ───────────────────────────────────────────────────────
// Wraps existing alert and recovery functionality with standardized interface

import pino, { Logger } from "pino";
import { Device, TheftReport, NotificationPreferences } from "../db/index.js";
import { 
  IRecoveryAlertEngine, 
  RecoveryAlertInput, 
  RecoveryAlertOutput, 
  RecoveryActions, 
  IntelligenceContext 
} from "./interfaces.js";
import { sendAlert as legacySendAlert } from "../services/notify.js";

const log: Logger = pino({ level: "info" }).child({ engine: "recovery_alert" });

export class RecoveryAlertEngine implements IRecoveryAlertEngine {
  private recoveryStatus: Map<string, RecoveryAlertOutput['recoveryStatus']> = new Map();

  async sendAlert(input: RecoveryAlertInput, context: IntelligenceContext): Promise<RecoveryAlertOutput> {
    const startTime = Date.now();
    log.info({ imei: input.imei, alertType: input.alertType, stakeholder: context.stakeholder }, "Recovery alert started");

    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine channels based on stakeholder and input
      const channels = input.channels || this.getDefaultChannels(context.stakeholder);
      
      // Send alert using legacy sendAlert for backward compatibility
      await legacySendAlert({
        type: input.alertType,
        imei: input.imei,
        userId: context.userId,
        message: input.message,
      });

      const channelResults = channels.map(channel => ({
        type: channel,
        status: 'sent' as const,
        timestamp: new Date(),
      }));

      // Determine recovery status based on alert severity
      let recoveryStatus: RecoveryAlertOutput['recoveryStatus'] = 'not_started';
      if (input.severity === 'critical') {
        recoveryStatus = 'in_progress';
        this.recoveryStatus.set(input.imei, recoveryStatus);
      }

      // Trigger recovery actions if critical
      const actionsTriggered: RecoveryActions = {
        remoteLock: false,
        remoteWipe: false,
        locationTracking: false,
        networkBlacklist: false,
        policeAlert: false,
      };

      if (input.severity === 'critical') {
        actionsTriggered.locationTracking = true;
        actionsTriggered.networkBlacklist = true;
        if (input.alertType === 'theft_report') {
          actionsTriggered.policeAlert = true;
        }
      }

      const nextSteps = this.generateNextSteps(input.alertType, input.severity, recoveryStatus);

      const output: RecoveryAlertOutput = {
        imei: input.imei,
        alertId,
        sent: true,
        channels: channelResults,
        actionsTriggered,
        recoveryStatus,
        nextSteps,
      };

      const processingTime = Date.now() - startTime;
      log.info({ imei: input.imei, alertId, processingTime }, "Recovery alert completed");

      return output;
    } catch (error) {
      log.error({ imei: input.imei, error }, "Recovery alert failed");
      throw error;
    }
  }

  async triggerRecoveryActions(imei: string, actions: Partial<RecoveryActions>): Promise<RecoveryActions> {
    log.info({ imei, actions }, "Triggering recovery actions");

    const device = await Device.findOne({ imei });
    if (!device) {
      throw new Error('Device not found');
    }

    const triggeredActions: RecoveryActions = {
      remoteLock: false,
      remoteWipe: false,
      locationTracking: false,
      networkBlacklist: false,
      policeAlert: false,
    };

    // Remote lock
    if (actions.remoteLock) {
      await Device.findByIdAndUpdate(imei, { status: 'locked' });
      triggeredActions.remoteLock = true;
      log.info({ imei }, "Remote lock triggered");
    }

    // Remote wipe (requires additional confirmation in production)
    if (actions.remoteWipe) {
      // In production, this would trigger a wipe sequence
      triggeredActions.remoteWipe = true;
      log.warn({ imei }, "Remote wipe requested");
    }

    // Location tracking
    if (actions.locationTracking) {
      await Device.findByIdAndUpdate(imei, { trackingEnabled: true });
      triggeredActions.locationTracking = true;
      log.info({ imei }, "Location tracking enabled");
    }

    // Network blacklist
    if (actions.networkBlacklist) {
      await Device.findByIdAndUpdate(imei, { status: 'blacklisted' });
      triggeredActions.networkBlacklist = true;
      log.info({ imei }, "Network blacklist triggered");
    }

    // Police alert
    if (actions.policeAlert) {
      const theftReport = await TheftReport.findOne({ imei });
      if (theftReport) {
        // In production, this would notify law enforcement
        triggeredActions.policeAlert = true;
        log.info({ imei }, "Police alert triggered");
      }
    }

    // Update recovery status
    this.recoveryStatus.set(imei, 'in_progress');

    return triggeredActions;
  }

  async getRecoveryStatus(imei: string): Promise<RecoveryAlertOutput['recoveryStatus']> {
    const device = await Device.findOne({ imei });
    
    if (!device) {
      return 'not_started';
    }

    if (device.status === 'recovered') {
      this.recoveryStatus.set(imei, 'successful');
      return 'successful';
    }

    if (device.status === 'blacklisted') {
      return 'in_progress';
    }

    return this.recoveryStatus.get(imei) || 'not_started';
  }

  async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    log.info({ userId }, "Updating notification preferences");

    await NotificationPreferences.findOneAndUpdate(
      { user: userId },
      preferences,
      { upsert: true, new: true }
    );

    log.info({ userId }, "Notification preferences updated");
  }

  private getDefaultChannels(stakeholder: IntelligenceContext['stakeholder']): Array<'sms' | 'email' | 'push' | 'in_app'> {
    switch (stakeholder) {
      case 'device_owner':
        return ['sms', 'email', 'push', 'in_app'];
      case 'telecom_operator':
        return ['email', 'in_app'];
      case 'law_enforcement':
        return ['email', 'in_app'];
      case 'internal_admin':
        return ['email', 'in_app'];
      default:
        return ['email', 'in_app'];
    }
  }

  private generateNextSteps(alertType: string, severity: string, recoveryStatus: RecoveryAlertOutput['recoveryStatus']): string[] {
    const nextSteps: string[] = [];

    if (recoveryStatus === 'in_progress') {
      nextSteps.push('Monitor device location');
      nextSteps.push('Coordinate with law enforcement if needed');
    }

    if (severity === 'critical') {
      nextSteps.push('Consider remote lock or wipe');
      nextSteps.push('Enable network blacklist');
    }

    if (alertType === 'theft_report') {
      nextSteps.push('File police report');
      nextSteps.push('Contact insurance provider');
      nextSteps.push('Monitor for device activity');
    }

    if (alertType === 'sim_swap') {
      nextSteps.push('Contact carrier to reverse SIM swap');
      nextSteps.push('Secure accounts with 2FA');
    }

    if (alertType === 'location_jump') {
      nextSteps.push('Investigate impossible travel pattern');
      nextSteps.push('Verify device possession');
    }

    return nextSteps;
  }
}

// Singleton instance
export const recoveryAlertEngine = new RecoveryAlertEngine();
