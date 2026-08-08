// api/police.ts - Police module API client
import { client } from './client';

export interface PoliceStation {
  _id: string;
  stationCode: string;
  name: string;
  jurisdiction: string;
  address: string;
  phone: string;
  email: string;
  stationHead: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface PoliceReport {
  _id: string;
  reportNumber: string;
  stationId: string;
  imei: string;
  incidentDate: string;
  incidentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  status: 'pending' | 'confirmed' | 'investigating' | 'resolved';
  createdAt: string;
}

export interface NationwideAlert {
  _id: string;
  imei: string;
  alertType: 'stolen_device' | 'wanted' | 'missing_person';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  lastKnownLocation: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  createdAt: string;
}

export interface RecoveryWorkflow {
  _id: string;
  imei: string;
  policeReportId: string;
  stage: 'reported' | 'investigating' | 'recovered' | 'closed';
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
  createdAt: string;
}

// Police Station Management
export const getPoliceStations = async (filters?: {
  status?: string;
  stationType?: string;
}) => {
  const response = await client.get('/police/stations', { params: filters });
  return response.data;
};

export const getPoliceStation = async (stationId: string) => {
  const response = await client.get(`/police/stations/${stationId}`);
  return response.data;
};

// Police Report Management
export const createPoliceReport = async (data: {
  stationId: string;
  imei: string;
  incidentDate: string;
  incidentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
}) => {
  const response = await client.post('/police/reports', data);
  return response.data;
};

export const getPoliceReport = async (reportId: string) => {
  const response = await client.get(`/police/reports/${reportId}`);
  return response.data;
};

export const getPoliceReportsByStation = async (stationId: string) => {
  const response = await client.get(`/police/reports/station/${stationId}`);
  return response.data;
};

export const getPoliceReportsByDevice = async (deviceId: string) => {
  const response = await client.get(`/police/reports/device/${deviceId}`);
  return response.data;
};

export const confirmPoliceReport = async (reportId: string, confirmationNotes: string) => {
  const response = await client.patch(`/police/reports/${reportId}/confirm`, { confirmationNotes });
  return response.data;
};

// Nationwide Alerts
export const createNationwideAlert = async (data: {
  imei: string;
  alertType: 'stolen_device' | 'wanted' | 'missing_person';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  lastKnownLocation: {
    lat: number;
    lng: number;
    timestamp: string;
  };
}) => {
  const response = await client.post('/police/alerts/nationwide', data);
  return response.data;
};

export const getNationwideAlert = async (alertId: string) => {
  const response = await client.get(`/police/alerts/nationwide/${alertId}`);
  return response.data;
};

export const getNationwideAlerts = async () => {
  const response = await client.get('/police/alerts/nationwide');
  return response.data;
};

// Recovery Workflow
export const createRecoveryWorkflow = async (data: {
  imei: string;
  policeReportId: string;
}) => {
  const response = await client.post('/police/recovery/workflow', data);
  return response.data;
};

export const updateRecoveryWorkflowStage = async (workflowId: string, data: {
  stage: 'reported' | 'investigating' | 'recovered' | 'closed';
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}) => {
  const response = await client.patch(`/police/recovery/workflow/${workflowId}/stage`, data);
  return response.data;
};

export const getRecoveryWorkflow = async (workflowId: string) => {
  const response = await client.get(`/police/recovery/workflow/${workflowId}`);
  return response.data;
};

// Police Statistics
export const getPoliceStatistics = async () => {
  const response = await client.get('/police/stats');
  return response.data;
};
