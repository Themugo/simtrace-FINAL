// ── Public Safety & Emergency Mode ───────────────────────────────────────────────
// Emergency workflows, rapid alerts, missing persons, stolen shipment tracking

export interface EmergencyWorkflow {
  id: string;
  type: 'missing_person' | 'stolen_shipment' | 'emergency_alert' | 'disaster_response';
  status: 'active' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  deviceId?: string;
  userId?: string;
  location?: { lat: number; lng: number };
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  notes: EmergencyNote[];
  alerts: EmergencyAlert[];
}

export interface EmergencyNote {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

export interface EmergencyAlert {
  id: string;
  type: 'sms' | 'email' | 'push' | 'broadcast';
  recipient: string;
  message: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface MissingPersonReport {
  id: string;
  workflowId: string;
  personName: string;
  personAge?: number;
  personDescription: string;
  lastSeenLocation: { lat: number; lng: number; address?: string };
  lastSeenTime: Date;
  deviceId?: string;
  clothingDescription?: string;
  medicalConditions?: string;
  emergencyContact: { name: string; phone: string; relation: string };
  photoUrl?: string;
  status: 'active' | 'found' | 'cancelled';
  createdAt: Date;
}

export interface StolenShipmentReport {
  id: string;
  workflowId: string;
  shipmentId: string;
  shipmentType: string;
  contents: string;
  value: number;
  lastKnownLocation: { lat: number; lng: number; address?: string };
  lastKnownTime: Date;
  deviceId?: string;
  vehicleDescription?: string;
  licensePlate?: string;
  reportingCompany: string;
  contactPerson: { name: string; phone: string; email: string };
  status: 'active' | 'recovered' | 'cancelled';
  createdAt: Date;
}

export interface RapidAlert {
  id: string;
  workflowId: string;
  alertType: 'amber' | 'silver' | 'red' | 'custom';
  radius: number; // in kilometers
  centerLocation: { lat: number; lng: number };
  message: string;
  targetAudience: 'public' | 'authorities' | 'partners' | 'all';
  sentAt: Date;
  expiresAt: Date;
  recipients: number;
}

class PublicSafetyEmergencyMode {
  private workflows: Map<string, EmergencyWorkflow> = new Map();
  private missingPersonReports: Map<string, MissingPersonReport> = new Map();
  private stolenShipmentReports: Map<string, StolenShipmentReport> = new Map();
  private rapidAlerts: Map<string, RapidAlert> = new Map();

  // Create emergency workflow
  createEmergencyWorkflow(workflow: Omit<EmergencyWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'alerts'>): EmergencyWorkflow {
    const emergencyWorkflow: EmergencyWorkflow = {
      ...workflow,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: [],
      alerts: [],
    };

    this.workflows.set(emergencyWorkflow.id, emergencyWorkflow);
    return emergencyWorkflow;
  }

  // Update workflow status
  updateWorkflowStatus(workflowId: string, status: EmergencyWorkflow['status'], assignedTo?: string): EmergencyWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    workflow.status = status;
    workflow.updatedAt = new Date();
    if (assignedTo) {
      workflow.assignedTo = assignedTo;
    }

    return workflow;
  }

  // Add note to workflow
  addWorkflowNote(workflowId: string, author: string, content: string): EmergencyNote | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const note: EmergencyNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author,
      content,
      timestamp: new Date(),
    };

    workflow.notes.push(note);
    workflow.updatedAt = new Date();
    return note;
  }

  // Add alert to workflow
  addWorkflowAlert(workflowId: string, alert: Omit<EmergencyAlert, 'id' | 'sentAt' | 'status'>): EmergencyAlert | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const emergencyAlert: EmergencyAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentAt: new Date(),
      status: 'pending',
    };

    workflow.alerts.push(emergencyAlert);
    workflow.updatedAt = new Date();
    return emergencyAlert;
  }

  // Get workflow
  getWorkflow(workflowId: string): EmergencyWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  // Get workflows by type
  getWorkflowsByType(type: EmergencyWorkflow['type']): EmergencyWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.type === type);
  }

  // Get workflows by status
  getWorkflowsByStatus(status: EmergencyWorkflow['status']): EmergencyWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.status === status);
  }

  // Get workflows by priority
  getWorkflowsByPriority(priority: EmergencyWorkflow['priority']): EmergencyWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.priority === priority);
  }

  // Get all workflows
  getAllWorkflows(): EmergencyWorkflow[] {
    return Array.from(this.workflows.values());
  }

  // Create missing person report
  createMissingPersonReport(report: Omit<MissingPersonReport, 'id' | 'createdAt'>): MissingPersonReport {
    const missingReport: MissingPersonReport = {
      ...report,
      id: `missing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.missingPersonReports.set(missingReport.id, missingReport);
    return missingReport;
  }

  // Update missing person status
  updateMissingPersonStatus(reportId: string, status: MissingPersonReport['status']): MissingPersonReport | null {
    const report = this.missingPersonReports.get(reportId);
    if (!report) return null;

    report.status = status;
    return report;
  }

  // Get missing person report
  getMissingPersonReport(reportId: string): MissingPersonReport | undefined {
    return this.missingPersonReports.get(reportId);
  }

  // Get all missing person reports
  getAllMissingPersonReports(): MissingPersonReport[] {
    return Array.from(this.missingPersonReports.values());
  }

  // Get active missing person reports
  getActiveMissingPersonReports(): MissingPersonReport[] {
    return Array.from(this.missingPersonReports.values()).filter(r => r.status === 'active');
  }

  // Create stolen shipment report
  createStolenShipmentReport(report: Omit<StolenShipmentReport, 'id' | 'createdAt'>): StolenShipmentReport {
    const stolenReport: StolenShipmentReport = {
      ...report,
      id: `stolen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    this.stolenShipmentReports.set(stolenReport.id, stolenReport);
    return stolenReport;
  }

  // Update stolen shipment status
  updateStolenShipmentStatus(reportId: string, status: StolenShipmentReport['status']): StolenShipmentReport | null {
    const report = this.stolenShipmentReports.get(reportId);
    if (!report) return null;

    report.status = status;
    return report;
  }

  // Get stolen shipment report
  getStolenShipmentReport(reportId: string): StolenShipmentReport | undefined {
    return this.stolenShipmentReports.get(reportId);
  }

  // Get all stolen shipment reports
  getAllStolenShipmentReports(): StolenShipmentReport[] {
    return Array.from(this.stolenShipmentReports.values());
  }

  // Get active stolen shipment reports
  getActiveStolenShipmentReports(): StolenShipmentReport[] {
    return Array.from(this.stolenShipmentReports.values()).filter(r => r.status === 'active');
  }

  // Create rapid alert
  createRapidAlert(alert: Omit<RapidAlert, 'id' | 'sentAt'>): RapidAlert {
    const rapidAlert: RapidAlert = {
      ...alert,
      id: `rapid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentAt: new Date(),
    };

    this.rapidAlerts.set(rapidAlert.id, rapidAlert);
    return rapidAlert;
  }

  // Get rapid alert
  getRapidAlert(alertId: string): RapidAlert | undefined {
    return this.rapidAlerts.get(alertId);
  }

  // Get rapid alerts by workflow
  getRapidAlertsByWorkflow(workflowId: string): RapidAlert[] {
    return Array.from(this.rapidAlerts.values()).filter(a => a.workflowId === workflowId);
  }

  // Get active rapid alerts
  getActiveRapidAlerts(): RapidAlert[] {
    const now = new Date();
    return Array.from(this.rapidAlerts.values()).filter(a => a.expiresAt > now);
  }

  // Get all rapid alerts
  getAllRapidAlerts(): RapidAlert[] {
    return Array.from(this.rapidAlerts.values());
  }

  // Find nearby workflows
  findNearbyWorkflows(location: { lat: number; lng: number }, radiusKm: number): EmergencyWorkflow[] {
    const nearby: EmergencyWorkflow[] = [];

    for (const workflow of this.workflows.values()) {
      if (workflow.location) {
        const distance = this.calculateDistance(location, workflow.location);
        if (distance <= radiusKm) {
          nearby.push(workflow);
        }
      }
    }

    return nearby.sort((a, b) => {
      const distA = a.location ? this.calculateDistance(location, a.location) : Infinity;
      const distB = b.location ? this.calculateDistance(location, b.location) : Infinity;
      return distA - distB;
    });
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLng = this.toRad(loc2.lng - loc1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(loc1.lat)) * Math.cos(this.toRad(loc2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert degrees to radians
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get statistics
  getStatistics(): {
    totalWorkflows: number;
    activeWorkflows: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    totalMissingPersonReports: number;
    activeMissingPersonReports: number;
    totalStolenShipmentReports: number;
    activeStolenShipmentReports: number;
    totalRapidAlerts: number;
    activeRapidAlerts: number;
  } {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const workflow of this.workflows.values()) {
      byType[workflow.type] = (byType[workflow.type] || 0) + 1;
      byStatus[workflow.status] = (byStatus[workflow.status] || 0) + 1;
      byPriority[workflow.priority] = (byPriority[workflow.priority] || 0) + 1;
    }

    return {
      totalWorkflows: this.workflows.size,
      activeWorkflows: Array.from(this.workflows.values()).filter(w => w.status === 'active').length,
      byType,
      byStatus,
      byPriority,
      totalMissingPersonReports: this.missingPersonReports.size,
      activeMissingPersonReports: this.getActiveMissingPersonReports().length,
      totalStolenShipmentReports: this.stolenShipmentReports.size,
      activeStolenShipmentReports: this.getActiveStolenShipmentReports().length,
      totalRapidAlerts: this.rapidAlerts.size,
      activeRapidAlerts: this.getActiveRapidAlerts().length,
    };
  }
}

// Singleton instance
export const emergencyMode = new PublicSafetyEmergencyMode();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function createEmergencyWorkflow(workflow: Omit<EmergencyWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'alerts'>): EmergencyWorkflow {
  return emergencyMode.createEmergencyWorkflow(workflow);
}

export function updateWorkflowStatus(workflowId: string, status: EmergencyWorkflow['status'], assignedTo?: string): EmergencyWorkflow | null {
  return emergencyMode.updateWorkflowStatus(workflowId, status, assignedTo);
}

export function addWorkflowNote(workflowId: string, author: string, content: string): EmergencyNote | null {
  return emergencyMode.addWorkflowNote(workflowId, author, content);
}

export function addWorkflowAlert(workflowId: string, alert: Omit<EmergencyAlert, 'id' | 'sentAt' | 'status'>): EmergencyAlert | null {
  return emergencyMode.addWorkflowAlert(workflowId, alert);
}

export function getWorkflow(workflowId: string): EmergencyWorkflow | undefined {
  return emergencyMode.getWorkflow(workflowId);
}

export function createMissingPersonReport(report: Omit<MissingPersonReport, 'id' | 'createdAt'>): MissingPersonReport {
  return emergencyMode.createMissingPersonReport(report);
}

export function updateMissingPersonStatus(reportId: string, status: MissingPersonReport['status']): MissingPersonReport | null {
  return emergencyMode.updateMissingPersonStatus(reportId, status);
}

export function createStolenShipmentReport(report: Omit<StolenShipmentReport, 'id' | 'createdAt'>): StolenShipmentReport {
  return emergencyMode.createStolenShipmentReport(report);
}

export function updateStolenShipmentStatus(reportId: string, status: StolenShipmentReport['status']): StolenShipmentReport | null {
  return emergencyMode.updateStolenShipmentStatus(reportId, status);
}

export function createRapidAlert(alert: Omit<RapidAlert, 'id' | 'sentAt'>): RapidAlert {
  return emergencyMode.createRapidAlert(alert);
}

export function findNearbyWorkflows(location: { lat: number; lng: number }, radiusKm: number): EmergencyWorkflow[] {
  return emergencyMode.findNearbyWorkflows(location, radiusKm);
}

export function getEmergencyStatistics() {
  return emergencyMode.getStatistics();
}
