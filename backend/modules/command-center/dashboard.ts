// ── Live Command Center Dashboard ───────────────────────────────────────────────────
// SOC-style dashboard for realtime monitoring and threat detection

import { emit, eventBus, Event, EventName } from '../../events/index.js';

export interface DashboardWidget {
  id: string;
  type: 'incidents' | 'movement' | 'telecom' | 'risk' | 'alerts' | 'stats';
  title: string;
  data: unknown;
  lastUpdated: Date;
}

export interface Incident {
  id: string;
  type: 'theft' | 'fraud' | 'sim_swap' | 'impossible_travel' | 'high_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  imei: string;
  description: string;
  location?: { lat: number; lng: number };
  timestamp: Date;
  status: 'active' | 'investigating' | 'resolved';
}

export interface MovementStream {
  imei: string;
  location: { lat: number; lng: number };
  timestamp: Date;
  speed: number;
  heading: number;
}

export interface TelecomFeed {
  imei: string;
  operator: string;
  event: 'sim_change' | 'blacklist_detected' | 'network_change';
  timestamp: Date;
  details: Record<string, unknown>;
}

export interface RiskAlert {
  imei: string;
  riskScore: number;
  threatLevel: string;
  riskFactors: string[];
  timestamp: Date;
}

export interface AIDetection {
  type: 'fraud_ring' | 'coordinated_theft' | 'repeat_offender' | 'pattern_anomaly';
  description: string;
  confidence: number;
  affectedDevices: string[];
  timestamp: Date;
}

class CommandCenterDashboard {
  private widgets: Map<string, DashboardWidget> = new Map();
  private incidents: Incident[] = [];
  private movementStreams: Map<string, MovementStream> = new Map();
  private telecomFeeds: TelecomFeed[] = [];
  private riskAlerts: RiskAlert[] = [];
  private aiDetections: AIDetection[] = [];

  constructor() {
    this.initializeWidgets();
    this.setupEventListeners();
  }

  // Initialize dashboard widgets
  private initializeWidgets(): void {
    this.widgets.set('active-incidents', {
      id: 'active-incidents',
      type: 'incidents',
      title: 'Active Incidents',
      data: [],
      lastUpdated: new Date(),
    });

    this.widgets.set('movement-stream', {
      id: 'movement-stream',
      type: 'movement',
      title: 'Live Movement Stream',
      data: [],
      lastUpdated: new Date(),
    });

    this.widgets.set('telecom-feed', {
      id: 'telecom-feed',
      type: 'telecom',
      title: 'Telecom Activity Feed',
      data: [],
      lastUpdated: new Date(),
    });

    this.widgets.set('high-risk-devices', {
      id: 'high-risk-devices',
      type: 'risk',
      title: 'High-Risk Devices',
      data: [],
      lastUpdated: new Date(),
    });

    this.widgets.set('ai-detections', {
      id: 'ai-detections',
      type: 'alerts',
      title: 'AI Detections',
      data: [],
      lastUpdated: new Date(),
    });

    this.widgets.set('system-stats', {
      id: 'system-stats',
      type: 'stats',
      title: 'System Statistics',
      data: {
        totalDevices: 0,
        activeDevices: 0,
        stolenDevices: 0,
        recoveredDevices: 0,
        riskScore: 0,
      },
      lastUpdated: new Date(),
    });
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Listen to device detected events
    eventBus.on('device.detected', (event: Event) => {
      this.handleDeviceDetected(event.data as Record<string, unknown>);
    });

    // Listen to risk calculated events
    eventBus.on('risk.calculated', (event: Event) => {
      this.handleRiskCalculated(event.data as Record<string, unknown>);
    });

    // Listen to high risk events
    eventBus.on('risk.high', (event: Event) => {
      this.handleHighRisk(event.data as Record<string, unknown>);
    });

    // Listen to SIM change events
    eventBus.on('sim.changed', (event: Event) => {
      this.handleSIMChange(event.data as Record<string, unknown>);
    });

    // Listen to agent events
    eventBus.on('agent.fraud_ring_detected' as EventName, (event: Event) => {
      this.handleFraudRingDetected(event.data as Record<string, unknown>);
    });

    eventBus.on('agent.suspicious_relationship' as EventName, (event: Event) => {
      this.handleSuspiciousRelationship(event.data as Record<string, unknown>);
    });

    eventBus.on('agent.recovery_opportunity' as EventName, (event: Event) => {
      this.handleRecoveryOpportunity(event.data as Record<string, unknown>);
    });
  }

  // Handle device detected event
  private handleDeviceDetected(data: Record<string, unknown>): void {
    const movementStream: MovementStream = {
      imei: data.imei as string,
      location: data.location as { lat: number; lng: number },
      timestamp: (data.timestamp as Date) || new Date(),
      speed: 0,
      heading: 0,
    };

    this.movementStreams.set(data.imei as string, movementStream);
    this.updateWidget('movement-stream', Array.from(this.movementStreams.values()));
  }

  // Handle risk calculated event
  private handleRiskCalculated(data: Record<string, unknown>): void {
    const riskAssessment = data.riskAssessment as Record<string, unknown>;
    const riskAlert: RiskAlert = {
      imei: data.imei as string,
      riskScore: riskAssessment.overallScore as number,
      threatLevel: riskAssessment.threatLevel as string,
      riskFactors: (riskAssessment.riskFactors as string[]) || [],
      timestamp: new Date(),
    };

    this.riskAlerts.push(riskAlert);
    this.riskAlerts = this.riskAlerts.slice(-100); // Keep last 100

    if (riskAlert.threatLevel === 'HIGH' || riskAlert.threatLevel === 'CRITICAL') {
      this.updateWidget('high-risk-devices', this.riskAlerts.filter(a => 
        a.threatLevel === 'HIGH' || a.threatLevel === 'CRITICAL'
      ));
    }
  }

  // Handle high risk event
  private handleHighRisk(data: Record<string, unknown>): void {
    const riskAssessment = data.riskAssessment as Record<string, unknown>;
    const incident: Incident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'high_risk',
      severity: (riskAssessment.threatLevel as string) === 'CRITICAL' ? 'critical' : 'high',
      imei: data.imei as string,
      description: `High risk detected: ${riskAssessment.threatLevel as string}`,
      timestamp: new Date(),
      status: 'active',
    };

    this.incidents.push(incident);
    this.updateWidget('active-incidents', this.incidents.filter(i => i.status !== 'resolved'));
  }

  // Handle SIM change event
  private handleSIMChange(data: Record<string, unknown>): void {
    const telecomFeed: TelecomFeed = {
      imei: data.imei as string,
      operator: 'Unknown',
      event: 'sim_change',
      timestamp: (data.timestamp as Date) || new Date(),
      details: {
        oldSimIccid: data.oldSimIccid as string,
        newSimIccid: data.newSimIccid as string,
      },
    };

    this.telecomFeeds.push(telecomFeed);
    this.telecomFeeds = this.telecomFeeds.slice(-50); // Keep last 50
    this.updateWidget('telecom-feed', this.telecomFeeds);

    // Create incident for SIM change
    const incident: Incident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'sim_swap',
      severity: 'high',
      imei: data.imei as string,
      description: 'SIM card changed',
      timestamp: new Date(),
      status: 'active',
    };

    this.incidents.push(incident);
    this.updateWidget('active-incidents', this.incidents.filter(i => i.status !== 'resolved'));
  }

  // Handle fraud ring detected
  private handleFraudRingDetected(data: Record<string, unknown>): void {
    const devices = data.devices as string[];
    const aiDetection: AIDetection = {
      type: 'fraud_ring',
      description: `Fraud ring detected with ${devices.length} devices`,
      confidence: 0.8,
      affectedDevices: devices,
      timestamp: new Date(),
    };

    this.aiDetections.push(aiDetection);
    this.aiDetections = this.aiDetections.slice(-20); // Keep last 20
    this.updateWidget('ai-detections', this.aiDetections);

    // Create incident
    const incident: Incident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'fraud',
      severity: 'critical',
      imei: devices[0],
      description: `Fraud ring detected: ${data.pattern as string}`,
      timestamp: new Date(),
      status: 'active',
    };

    this.incidents.push(incident);
    this.updateWidget('active-incidents', this.incidents.filter(i => i.status !== 'resolved'));
  }

  // Handle suspicious relationship
  private handleSuspiciousRelationship(data: Record<string, unknown>): void {
    const aiDetection: AIDetection = {
      type: 'pattern_anomaly',
      description: `Suspicious device-SIM relationship: ${data.duration as number} days`,
      confidence: 0.7,
      affectedDevices: [data.imei as string],
      timestamp: new Date(),
    };

    this.aiDetections.push(aiDetection);
    this.aiDetections = this.aiDetections.slice(-20);
    this.updateWidget('ai-detections', this.aiDetections);
  }

  // Handle recovery opportunity
  private handleRecoveryOpportunity(data: Record<string, unknown>): void {
    const recoveryLikelihood = data.recoveryLikelihood as number;
    const aiDetection: AIDetection = {
      type: 'pattern_anomaly',
      description: `Recovery opportunity detected (${(recoveryLikelihood * 100).toFixed(0)}% confidence)`,
      confidence: recoveryLikelihood,
      affectedDevices: [data.imei as string],
      timestamp: new Date(),
    };

    this.aiDetections.push(aiDetection);
    this.aiDetections = this.aiDetections.slice(-20);
    this.updateWidget('ai-detections', this.aiDetections);
  }

  // Update widget
  private updateWidget(widgetId: string, data: unknown): void {
    const widget = this.widgets.get(widgetId);
    if (widget) {
      widget.data = data;
      widget.lastUpdated = new Date();
    }

    // Emit widget update event
    emit('dashboard.widget_updated' as EventName, {
      widgetId,
      data,
      timestamp: new Date(),
    });
  }

  // Get all widgets
  getWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  // Get specific widget
  getWidget(widgetId: string): DashboardWidget | undefined {
    return this.widgets.get(widgetId);
  }

  // Get active incidents
  getActiveIncidents(): Incident[] {
    return this.incidents.filter(i => i.status !== 'resolved');
  }

  // Resolve incident
  resolveIncident(incidentId: string): void {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      incident.status = 'resolved';
      this.updateWidget('active-incidents', this.incidents.filter(i => i.status !== 'resolved'));
    }
  }

  // Update system stats
  async updateSystemStats(): Promise<void> {
    // This would query the database for actual stats
    const stats = {
      totalDevices: 0,
      activeDevices: 0,
      stolenDevices: 0,
      recoveredDevices: 0,
      riskScore: 0,
    };

    this.updateWidget('system-stats', stats);
  }

  // Clear old data
  clearOldData(maxAgeHours = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    this.incidents = this.incidents.filter(i => i.timestamp > cutoff);
    this.telecomFeeds = this.telecomFeeds.filter(f => f.timestamp > cutoff);
    this.riskAlerts = this.riskAlerts.filter(r => r.timestamp > cutoff);
    this.aiDetections = this.aiDetections.filter(d => d.timestamp > cutoff);
  }
}

// Singleton instance
export const commandCenterDashboard = new CommandCenterDashboard();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function getDashboardWidgets(): DashboardWidget[] {
  return commandCenterDashboard.getWidgets();
}

export function getDashboardWidget(widgetId: string): DashboardWidget | undefined {
  return commandCenterDashboard.getWidget(widgetId);
}

export function getActiveIncidents(): Incident[] {
  return commandCenterDashboard.getActiveIncidents();
}

export function resolveIncident(incidentId: string): void {
  commandCenterDashboard.resolveIncident(incidentId);
}

export async function updateSystemStats(): Promise<void> {
  await commandCenterDashboard.updateSystemStats();
}

export function clearOldData(maxAgeHours = 24): void {
  commandCenterDashboard.clearOldData(maxAgeHours);
}
