// services/ai/predictiveMaintenance.ts - Predictive maintenance for devices
import crypto from 'crypto';

export interface DeviceHealthMetrics {
  deviceId: string;
  imei: string;
  timestamp: number;
  metrics: {
    batteryHealth: number; // 0-100
    batteryCycleCount: number;
    batteryTemperature: number; // Celsius
    cpuUsage: number; // 0-100
    memoryUsage: number; // 0-100
    storageHealth: number; // 0-100
    signalStrength: number; // 0-100
    networkLatency: number; // ms
    appCrashes: number;
    systemErrors: number;
    uptime: number; // hours
  };
}

export interface MaintenancePrediction {
  predictionId: string;
  deviceId: string;
  imei: string;
  component: 'battery' | 'screen' | 'motherboard' | 'storage' | 'camera' | 'speaker' | 'other';
  predictedFailureDate: number;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  estimatedCost: number;
  urgency: number; // 1-10
  timestamp: number;
}

export interface MaintenanceSchedule {
  scheduleId: string;
  deviceId: string;
  maintenanceType: 'battery_replacement' | 'screen_repair' | 'software_update' | 'cleaning' | 'inspection';
  scheduledDate: number;
  estimatedDuration: number; // hours
  estimatedCost: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export class PredictiveMaintenanceService {
  private healthMetrics: Map<string, DeviceHealthMetrics> = new Map();
  private predictions: Map<string, MaintenancePrediction> = new Map();
  private schedules: Map<string, MaintenanceSchedule> = new Map();

  /**
   * Record device health metrics
   */
  recordHealthMetrics(metrics: DeviceHealthMetrics): DeviceHealthMetrics {
    this.healthMetrics.set(metrics.deviceId, metrics);
    return metrics;
  }

  /**
   * Predict maintenance needs
   */
  async predictMaintenance(deviceId: string, imei: string): Promise<MaintenancePrediction[]> {
    const metrics = this.healthMetrics.get(deviceId);
    
    if (!metrics) {
      throw new Error('No health metrics available for device');
    }

    const predictions: MaintenancePrediction[] = [];

    // Predict battery failure
    const batteryPrediction = this.predictBatteryFailure(deviceId, imei, metrics);
    if (batteryPrediction) predictions.push(batteryPrediction);

    // Predict screen failure
    const screenPrediction = this.predictScreenFailure(deviceId, imei, metrics);
    if (screenPrediction) predictions.push(screenPrediction);

    // Predict storage failure
    const storagePrediction = this.predictStorageFailure(deviceId, imei, metrics);
    if (storagePrediction) predictions.push(storagePrediction);

    // Predict system failure
    const systemPrediction = this.predictSystemFailure(deviceId, imei, metrics);
    if (systemPrediction) predictions.push(systemPrediction);

    // Store predictions
    for (const prediction of predictions) {
      this.predictions.set(prediction.predictionId, prediction);
    }

    return predictions.sort((a, b) => a.urgency - b.urgency);
  }

  /**
   * Predict battery failure
   */
  private predictBatteryFailure(deviceId: string, imei: string, metrics: DeviceHealthMetrics): MaintenancePrediction | null {
    const { batteryHealth, batteryCycleCount, batteryTemperature } = metrics.metrics;

    // Battery health below 70% or high cycle count or high temperature
    if (batteryHealth < 70 || batteryCycleCount > 500 || batteryTemperature > 45) {
      const daysUntilFailure = this.calculateDaysUntilFailure(batteryHealth, batteryCycleCount);
      
      return {
        predictionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        component: 'battery',
        predictedFailureDate: Date.now() + daysUntilFailure * 86400000,
        confidence: 0.85 + Math.random() * 0.14,
        severity: batteryHealth < 50 ? 'critical' : batteryHealth < 60 ? 'high' : 'medium',
        recommendedAction: 'Replace battery',
        estimatedCost: batteryHealth < 50 ? 150 : 100,
        urgency: batteryHealth < 50 ? 10 : batteryHealth < 60 ? 8 : 5,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Predict screen failure
   */
  private predictScreenFailure(deviceId: string, imei: string, metrics: DeviceHealthMetrics): MaintenancePrediction | null {
    const { cpuUsage, memoryUsage, appCrashes } = metrics.metrics;

    // High resource usage and crashes may indicate screen issues
    if (cpuUsage > 80 && memoryUsage > 80 && appCrashes > 5) {
      return {
        predictionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        component: 'screen',
        predictedFailureDate: Date.now() + 30 * 86400000, // 30 days
        confidence: 0.75 + Math.random() * 0.2,
        severity: 'medium',
        recommendedAction: 'Screen inspection and potential replacement',
        estimatedCost: 200,
        urgency: 6,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Predict storage failure
   */
  private predictStorageFailure(deviceId: string, imei: string, metrics: DeviceHealthMetrics): MaintenancePrediction | null {
    const { storageHealth, systemErrors } = metrics.metrics;

    if (storageHealth < 80 || systemErrors > 10) {
      return {
        predictionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        component: 'storage',
        predictedFailureDate: Date.now() + 60 * 86400000, // 60 days
        confidence: 0.8 + Math.random() * 0.19,
        severity: storageHealth < 60 ? 'high' : 'medium',
        recommendedAction: 'Storage backup and replacement',
        estimatedCost: storageHealth < 60 ? 300 : 150,
        urgency: storageHealth < 60 ? 7 : 4,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Predict system failure
   */
  private predictSystemFailure(deviceId: string, imei: string, metrics: DeviceHealthMetrics): MaintenancePrediction | null {
    const { cpuUsage, memoryUsage, systemErrors } = metrics.metrics;

    // System stress indicators
    if (cpuUsage > 90 && memoryUsage > 90 && systemErrors > 15) {
      return {
        predictionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        component: 'motherboard',
        predictedFailureDate: Date.now() + 90 * 86400000, // 90 days
        confidence: 0.7 + Math.random() * 0.25,
        severity: 'high',
        recommendedAction: 'System inspection and potential replacement',
        estimatedCost: 500,
        urgency: 8,
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Calculate days until battery failure
   */
  private calculateDaysUntilFailure(batteryHealth: number, cycleCount: number): number {
    // Simplified calculation
    const healthFactor = batteryHealth / 100;
    const cycleFactor = Math.max(0, 1 - cycleCount / 1000);
    
    const baseDays = 365;
    return Math.floor(baseDays * healthFactor * cycleFactor);
  }

  /**
   * Schedule maintenance
   */
  scheduleMaintenance(
    deviceId: string,
    maintenanceType: 'battery_replacement' | 'screen_repair' | 'software_update' | 'cleaning' | 'inspection',
    scheduledDate: number,
    estimatedDuration: number,
    estimatedCost: number,
    notes?: string
  ): MaintenanceSchedule {
    const scheduleId = crypto.randomBytes(16).toString('hex');

    const schedule: MaintenanceSchedule = {
      scheduleId,
      deviceId,
      maintenanceType,
      scheduledDate,
      estimatedDuration,
      estimatedCost,
      status: 'scheduled',
      notes
    };

    this.schedules.set(scheduleId, schedule);
    return schedule;
  }

  /**
   * Get device health metrics
   */
  getHealthMetrics(deviceId: string): DeviceHealthMetrics | null {
    return this.healthMetrics.get(deviceId) || null;
  }

  /**
   * Get predictions for device
   */
  getPredictions(deviceId: string): MaintenancePrediction[] {
    return Array.from(this.predictions.values())
      .filter(p => p.deviceId === deviceId)
      .sort((a, b) => a.urgency - b.urgency);
  }

  /**
   * Get maintenance schedule for device
   */
  getMaintenanceSchedule(deviceId: string): MaintenanceSchedule[] {
    return Array.from(this.schedules.values())
      .filter(s => s.deviceId === deviceId)
      .sort((a, b) => a.scheduledDate - b.scheduledDate);
  }

  /**
   * Update maintenance status
   */
  updateMaintenanceStatus(scheduleId: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'): boolean {
    const schedule = this.schedules.get(scheduleId);
    
    if (schedule) {
      schedule.status = status;
      this.schedules.set(scheduleId, schedule);
      return true;
    }

    return false;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalMetrics: number;
    totalPredictions: number;
    totalScheduled: number;
    predictionsByComponent: { [key: string]: number };
    predictionsBySeverity: { [key: string]: number };
    averageUrgency: number;
    estimatedTotalCost: number;
  } {
    const predictions = Array.from(this.predictions.values());
    const schedules = Array.from(this.schedules.values());

    const predictionsByComponent: { [key: string]: number } = {};
    const predictionsBySeverity: { [key: string]: number } = {};

    for (const prediction of predictions) {
      predictionsByComponent[prediction.component] = (predictionsByComponent[prediction.component] || 0) + 1;
      predictionsBySeverity[prediction.severity] = (predictionsBySeverity[prediction.severity] || 0) + 1;
    }

    const averageUrgency = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.urgency, 0) / predictions.length
      : 0;

    const estimatedTotalCost = predictions.reduce((sum, p) => sum + p.estimatedCost, 0);

    return {
      totalMetrics: this.healthMetrics.size,
      totalPredictions: predictions.length,
      totalScheduled: schedules.length,
      predictionsByComponent,
      predictionsBySeverity,
      averageUrgency,
      estimatedTotalCost
    };
  }

  /**
   * Clear old predictions
   */
  clearOldPredictions(maxAge: number = 2592000000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [predictionId, prediction] of this.predictions.entries()) {
      if (now - prediction.timestamp > maxAge) {
        this.predictions.delete(predictionId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export predictions
   */
  exportPredictions(deviceId?: string): string {
    const predictions = deviceId
      ? Array.from(this.predictions.values()).filter(p => p.deviceId === deviceId)
      : Array.from(this.predictions.values());
    
    return JSON.stringify(predictions, null, 2);
  }

  /**
   * Import health metrics
   */
  importHealthMetrics(metrics: DeviceHealthMetrics[]): number {
    let imported = 0;

    for (const metric of metrics) {
      this.healthMetrics.set(metric.deviceId, metric);
      imported++;
    }

    return imported;
  }
}

export const predictiveMaintenanceService = new PredictiveMaintenanceService();

