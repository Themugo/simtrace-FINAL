import * as DeviceInfo from 'expo-device';
import * as SecureStore from 'expo-secure-store';

export interface DeviceInfo {
  imei: string;
  imei2?: string;
  serialNumber: string;
  model: string;
  brand: string;
  osVersion: string;
  platform: string;
  macAddress?: string;
  deviceDna: string;
  screenResolution: string;
  totalStorage: number;
  availableStorage: number;
  cpuInfo: string;
}

export class DeviceScanner {
  private static instance: DeviceScanner;

  private constructor() {}

  static getInstance(): DeviceScanner {
    if (!DeviceScanner.instance) {
      DeviceScanner.instance = new DeviceScanner();
    }
    return DeviceScanner.instance;
  }

  async scanDevice(): Promise<DeviceInfo> {
    const [
      imei,
      imei2,
      serialNumber,
      model,
      brand,
      osVersion,
      platform,
      macAddress,
      screenResolution,
      totalStorage,
      availableStorage,
      cpuInfo,
    ] = await Promise.all([
      this.getImei(),
      this.getImei2(),
      this.getSerialNumber(),
      DeviceInfo.model(),
      DeviceInfo.brand(),
      DeviceInfo.osVersion(),
      DeviceInfo.platform(),
      this.getMacAddress(),
      this.getScreenResolution(),
      this.getTotalStorage(),
      this.getAvailableStorage(),
      this.getCpuInfo(),
    ]);

    const deviceDna = this.generateDeviceDna({
      imei,
      serialNumber,
      model,
      brand,
      osVersion,
      platform,
    });

    return {
      imei,
      imei2,
      serialNumber,
      model,
      brand,
      osVersion,
      platform,
      macAddress,
      deviceDna,
      screenResolution,
      totalStorage,
      availableStorage,
      cpuInfo,
    };
  }

  private async getImei(): Promise<string> {
    try {
      // In production, use react-native-imei or native module
      // For now, return a placeholder
      return await SecureStore.getItemAsync('device_imei') || '';
    } catch (error) {
      console.error('Error getting IMEI:', error);
      return '';
    }
  }

  private async getImei2(): Promise<string | undefined> {
    try {
      // For dual SIM devices
      return await SecureStore.getItemAsync('device_imei2') || undefined;
    } catch (error) {
      console.error('Error getting IMEI2:', error);
      return undefined;
    }
  }

  private async getSerialNumber(): Promise<string> {
    try {
      // In production, use native module to get serial number
      return await SecureStore.getItemAsync('device_serial') || '';
    } catch (error) {
      console.error('Error getting serial number:', error);
      return '';
    }
  }

  private async getMacAddress(): Promise<string | undefined> {
    try {
      // In production, use react-native-network-info
      return undefined;
    } catch (error) {
      console.error('Error getting MAC address:', error);
      return undefined;
    }
  }

  private async getScreenResolution(): Promise<string> {
    try {
      const { width, height } = await DeviceInfo.getDimensionsAsync();
      return `${width}x${height}`;
    } catch (error) {
      console.error('Error getting screen resolution:', error);
      return 'Unknown';
    }
  }

  private async getTotalStorage(): Promise<number> {
    try {
      const storage = await DeviceInfo.getTotalDiskCapacity();
      return storage || 0;
    } catch (error) {
      console.error('Error getting total storage:', error);
      return 0;
    }
  }

  private async getAvailableStorage(): Promise<number> {
    try {
      const storage = await DeviceInfo.getFreeDiskStorage();
      return storage || 0;
    } catch (error) {
      console.error('Error getting available storage:', error);
      return 0;
    }
  }

  private async getCpuInfo(): Promise<string> {
    try {
      // In production, use native module to get CPU info
      return await DeviceInfo.supportedAbisAsync().then((abis) => abis.join(', '));
    } catch (error) {
      console.error('Error getting CPU info:', error);
      return 'Unknown';
    }
  }

  private generateDeviceDna(data: {
    imei: string;
    serialNumber: string;
    model: string;
    brand: string;
    osVersion: string;
    platform: string;
  }): string {
    // Create a unique device fingerprint
    const dnaString = [
      data.imei,
      data.serialNumber,
      data.model,
      data.brand,
      data.osVersion,
      data.platform,
    ].join('|');

    // Simple hash function (in production, use crypto module)
    let hash = 0;
    for (let i = 0; i < dnaString.length; i++) {
      const char = dnaString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16).padStart(32, '0');
  }

  async saveDeviceInfo(info: DeviceInfo): Promise<void> {
    try {
      await SecureStore.setItemAsync('device_info', JSON.stringify(info));
    } catch (error) {
      console.error('Error saving device info:', error);
    }
  }

  async getSavedDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      const info = await SecureStore.getItemAsync('device_info');
      return info ? JSON.parse(info) : null;
    } catch (error) {
      console.error('Error getting saved device info:', error);
      return null;
    }
  }

  async clearDeviceInfo(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('device_info');
    } catch (error) {
      console.error('Error clearing device info:', error);
    }
  }
}

export default DeviceScanner.getInstance();
