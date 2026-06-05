// api/devices.ts - Device management API calls
import apiClient from './client';
import { z } from 'zod';

// Validation schemas
export const addDeviceSchema = z.object({
  imei: z.string().min(15).max(17),
  phoneNumber: z.string().min(10),
  deviceName: z.string().min(1),
  deviceType: z.enum(['phone', 'tablet', 'laptop', 'other']),
  nickname: z.string().optional(),
});

export const updateDeviceSchema = z.object({
  deviceName: z.string().optional(),
  nickname: z.string().optional(),
  trackingEnabled: z.boolean().optional(),
});

// Types
export interface Device {
  id: string;
  imei: string;
  phoneNumber: string;
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'laptop' | 'other';
  nickname?: string;
  trackingEnabled: boolean;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  status: 'active' | 'inactive' | 'stolen' | 'recovered';
  createdAt: string;
  updatedAt: string;
}

export interface AddDeviceRequest {
  imei: string;
  phoneNumber: string;
  deviceName: string;
  deviceType: 'phone' | 'tablet' | 'laptop' | 'other';
  nickname?: string;
}

export interface UpdateDeviceRequest {
  deviceName?: string;
  nickname?: string;
  trackingEnabled?: boolean;
}

export interface DeviceLocation {
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  batteryLevel?: number;
  networkType?: string;
}

// API functions
export const deviceService = {
  async getDevices(): Promise<Device[]> {
    const response = await apiClient.get('/devices');
    return response.data;
  },

  async getDevice(deviceId: string): Promise<Device> {
    const response = await apiClient.get(`/devices/${deviceId}`);
    return response.data;
  },

  async addDevice(data: AddDeviceRequest): Promise<Device> {
    const response = await apiClient.post('/devices', data);
    return response.data;
  },

  async updateDevice(deviceId: string, data: UpdateDeviceRequest): Promise<Device> {
    const response = await apiClient.patch(`/devices/${deviceId}`, data);
    return response.data;
  },

  async deleteDevice(deviceId: string): Promise<void> {
    await apiClient.delete(`/devices/${deviceId}`);
  },

  async getDeviceLocation(deviceId: string): Promise<DeviceLocation> {
    const response = await apiClient.get(`/devices/${deviceId}/location`);
    return response.data;
  },

  async enableTracking(deviceId: string): Promise<Device> {
    const response = await apiClient.post(`/devices/${deviceId}/enable-tracking`);
    return response.data;
  },

  async disableTracking(deviceId: string): Promise<Device> {
    const response = await apiClient.post(`/devices/${deviceId}/disable-tracking`);
    return response.data;
  },

  async reportTheft(deviceId: string, data: { description: string; location?: { latitude: number; longitude: number } }): Promise<void> {
    await apiClient.post(`/devices/${deviceId}/report-theft`, data);
  },

  async markRecovered(deviceId: string): Promise<Device> {
    const response = await apiClient.post(`/devices/${deviceId}/mark-recovered`);
    return response.data;
  },
};

export default deviceService;
