// Police Module - Core police integration functionality
import { Device, Alert } from '../../db/index.js';
import { getIO } from '../../services/socket.js';
import mongoose from 'mongoose';

export interface PoliceStation {
  _id: string;
  stationCode: string;
  name: string;
  jurisdiction: string;
  address: string;
  phone: string;
  email: string;
  stationHead: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface PoliceReport {
  _id: string;
  reportNumber: string;
  stationId: string;
  imei: string;
  reportedBy: string;
  incidentDate: Date;
  incidentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  assignedOfficer?: string;
  evidence: Array<{
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecoveryWorkflow {
  _id: string;
  reportId: string;
  imei: string;
  stage: 'reported' | 'investigating' | 'tracking' | 'located' | 'recovering' | 'recovered' | 'returned' | 'closed';
  assignedTeam: string[];
  notes: Array<{
    addedBy: string;
    content: string;
    timestamp: Date;
  }>;
  timeline: Array<{
    stage: string;
    timestamp: Date;
    location?: {
      lat: number;
      lng: number;
    };
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Police Station Management
export async function createPoliceStation(data: Omit<PoliceStation, '_id' | 'createdAt' | 'updatedAt'>): Promise<PoliceStation> {
  const station = {
    ...data,
    _id: new mongoose.Types.ObjectId().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  // In production, save to database
  return station;
}

export async function getPoliceStation(_stationId: string): Promise<PoliceStation | null> {
  // In production, fetch from database
  return null;
}

export async function listPoliceStations(_filters?: { status?: string; jurisdiction?: string }): Promise<PoliceStation[]> {
  // In production, fetch from database with filters
  return [];
}

// Police Report Management
export async function createPoliceReport(data: Omit<PoliceReport, '_id' | 'reportNumber' | 'createdAt' | 'updatedAt'>): Promise<PoliceReport> {
  const reportNumber = generateReportNumber(data.stationId);
  const report = {
    ...data,
    _id: new mongoose.Types.ObjectId().toString(),
    reportNumber,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Update device status to stolen
  await Device.findOneAndUpdate({ imei: data.imei }, { status: 'stolen' });

  // Create alert
  await Alert.create({
    imei: data.imei,
    type: 'theft_report',
    payload: { reportNumber, stationId: data.stationId },
    narrative: `Police report filed: ${reportNumber}`,
    read: false,
    ts: new Date(),
  });

  // Emit real-time notification
  getIO().to(`device:${data.imei}`).emit('police_report_created', {
    reportNumber,
    stationId: data.stationId,
    timestamp: report.createdAt,
  });

  return report;
}

export async function getPoliceReport(_reportId: string): Promise<PoliceReport | null> {
  // In production, fetch from database
  return null;
}

export async function updatePoliceReport(_reportId: string, _updates: Partial<PoliceReport>): Promise<PoliceReport | null> {
  // In production, update in database
  return null;
}

// Recovery Workflow Management
export async function createRecoveryWorkflow(reportId: string, imei: string): Promise<RecoveryWorkflow> {
  const workflow: RecoveryWorkflow = {
    _id: new mongoose.Types.ObjectId().toString(),
    reportId,
    imei,
    stage: 'reported',
    assignedTeam: [],
    notes: [],
    timeline: [{
      stage: 'reported',
      timestamp: new Date(),
    }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return workflow;
}

export async function updateRecoveryStage(workflowId: string, stage: RecoveryWorkflow['stage'], location?: { lat: number; lng: number }, notes?: string): Promise<RecoveryWorkflow | null> {
  const workflow = await getRecoveryWorkflow(workflowId);
  if (!workflow) return null;

  workflow.stage = stage;
  workflow.timeline.push({
    stage,
    timestamp: new Date(),
    location,
    notes,
  });
  workflow.updatedAt = new Date();

  // Emit real-time update
  getIO().to(`device:${workflow.imei}`).emit('recovery_stage_updated', {
    stage,
    timestamp: new Date(),
    location,
  });

  return workflow;
}

export async function getRecoveryWorkflow(_workflowId: string): Promise<RecoveryWorkflow | null> {
  // In production, fetch from database
  return null;
}

export async function addWorkflowNote(workflowId: string, addedBy: string, content: string): Promise<RecoveryWorkflow | null> {
  const workflow = await getRecoveryWorkflow(workflowId);
  if (!workflow) return null;

  workflow.notes.push({
    addedBy,
    content,
    timestamp: new Date(),
  });
  workflow.updatedAt = new Date();

  return workflow;
}

// Nationwide Alert System
export async function createNationwideAlert(data: {
  imei: string;
  alertType: 'amber' | 'silver' | 'stolen_device';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  lastKnownLocation: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
  issuedBy: string;
}): Promise<any> {
  const alert = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...data,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };

  // Emit to all law enforcement rooms
  getIO().to('role:law_enforcement').emit('nationwide_alert', alert);

  return alert;
}

// Case Transfer System
export async function transferCase(reportId: string, _fromStationId: string, toStationId: string, _reason: string): Promise<PoliceReport | null> {
  const report = await getPoliceReport(reportId);
  if (!report) return null;

  await updatePoliceReport(reportId, {
    stationId: toStationId,
  });

  // Add note about transfer
  // In production, add to workflow notes

  return report;
}

// Helper Functions
function generateReportNumber(stationId: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `POL${stationId.toUpperCase()}${year}${month}${random}`;
}

// Statistics
export async function getPoliceStatistics(_stationId?: string) {
  const stats = {
    totalReports: 0,
    openCases: 0,
    closedCases: 0,
    recoveryRate: 0,
    avgResolutionTime: 0,
  };

  // In production, calculate from database
  return stats;
}
