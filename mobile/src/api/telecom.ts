// api/telecom.ts - Telecom module API client
import { client } from './client';

export interface SIMCard {
  _id: string;
  iccid: string;
  imsi: string;
  msisdn: string;
  operator: string;
  status: 'active' | 'inactive' | 'reported_stolen' | 'blocked';
  associatedDevice?: string;
  lastActivity?: string;
  createdAt: string;
}

export interface NetworkActivity {
  _id: string;
  iccid: string;
  activityType: 'call' | 'sms' | 'data';
  destination?: string;
  duration?: number;
  dataUsed?: number;
  timestamp: string;
}

export interface CellTower {
  _id: string;
  towerId: string;
  operator: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  coverageRadius: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// SIM Card Management
export const registerSIM = async (data: {
  iccid: string;
  imsi: string;
  msisdn: string;
  operator: string;
  associatedDevice?: string;
}) => {
  const response = await client.post('/telecom/sim/register', data);
  return response.data;
};

export const getSIM = async (simId: string) => {
  const response = await client.get(`/telecom/sim/${simId}`);
  return response.data;
};

export const updateSIMLocation = async (data: {
  iccid: string;
  location: {
    lat: number;
    lng: number;
    cellTowerId: string;
  };
}) => {
  const response = await client.post('/telecom/sim/location', data);
  return response.data;
};

export const flagSIMAsStolen = async (data: {
  iccid: string;
  reportedBy: string;
  reason: string;
}) => {
  const response = await client.post('/telecom/sim/flag-stolen', data);
  return response.data;
};

export const detectSIMSwap = async (data: {
  imei: string;
  newIccid: string;
  oldIccid: string;
}) => {
  const response = await client.post('/telecom/sim/detect-swap', data);
  return response.data;
};

// Network Activity Tracking
export const trackCallActivity = async (data: {
  iccid: string;
  destination: string;
  duration: number;
}) => {
  const response = await client.post('/telecom/activity/call', data);
  return response.data;
};

export const trackSMSActivity = async (data: {
  iccid: string;
  destination: string;
}) => {
  const response = await client.post('/telecom/activity/sms', data);
  return response.data;
};

export const trackDataActivity = async (data: {
  iccid: string;
  dataUsed: number;
}) => {
  const response = await client.post('/telecom/activity/data', data);
  return response.data;
};

export const getNetworkActivity = async (iccid: string) => {
  const response = await client.get(`/telecom/activity/sim/${iccid}`);
  return response.data;
};

// Cell Tower Management
export const registerCellTower = async (data: {
  towerId: string;
  operator: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  coverageRadius: number;
}) => {
  const response = await client.post('/telecom/tower/register', data);
  return response.data;
};

export const getCellTower = async (towerId: string) => {
  const response = await client.get(`/telecom/tower/${towerId}`);
  return response.data;
};

export const getNearbyCellTowers = async (params: {
  lat: number;
  lng: number;
  radius: number;
}) => {
  const response = await client.get('/telecom/tower/nearby', { params });
  return response.data;
};

export const getCellTowers = async () => {
  const response = await client.get('/telecom/towers');
  return response.data;
};

// Cell Tower Triangulation
export const triangulateDevice = async (data: {
  imei: string;
}) => {
  const response = await client.post('/telecom/triangulate', data);
  return response.data;
};

// Telecom Statistics
export const getTelecomStatistics = async () => {
  const response = await client.get('/telecom/stats');
  return response.data;
};

// Commission Calculation
export const calculateCommission = async (data: {
  telecomCompanyId: string;
  period: string;
}) => {
  const response = await client.post('/telecom/commission/calculate', data);
  return response.data;
};
