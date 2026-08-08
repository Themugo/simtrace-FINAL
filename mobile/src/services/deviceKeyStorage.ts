// services/deviceKeyStorage.ts - Secure device key storage service
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const DEVICE_KEY_STORAGE_KEY = 'simtrace_device_key';
const ENCRYPTION_KEY = 'simtrace_encryption_key';

class DeviceKeyStorageService {
  // Store device key securely
  async storeDeviceKey(deviceKey: string): Promise<boolean> {
    try {
      // Encrypt the device key before storing
      const encryptedKey = CryptoJS.AES.encrypt(deviceKey, ENCRYPTION_KEY).toString();
      await SecureStore.setItemAsync(DEVICE_KEY_STORAGE_KEY, encryptedKey);
      return true;
    } catch (error) {
      console.error('Error storing device key:', error);
      return false;
    }
  }

  // Retrieve device key securely
  async getDeviceKey(): Promise<string | null> {
    try {
      const encryptedKey = await SecureStore.getItemAsync(DEVICE_KEY_STORAGE_KEY);
      if (!encryptedKey) {
        return null;
      }

      // Decrypt the device key
      const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
      const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedKey;
    } catch (error) {
      console.error('Error retrieving device key:', error);
      return null;
    }
  }

  // Delete device key securely
  async deleteDeviceKey(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(DEVICE_KEY_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error deleting device key:', error);
      return false;
    }
  }

  // Check if device key exists
  async hasDeviceKey(): Promise<boolean> {
    try {
      const key = await this.getDeviceKey();
      return key !== null;
    } catch (error) {
      console.error('Error checking device key existence:', error);
      return false;
    }
  }

  // Store additional device metadata
  async storeDeviceMetadata(metadata: Record<string, any>): Promise<boolean> {
    try {
      const metadataKey = 'simtrace_device_metadata';
      const encryptedMetadata = CryptoJS.AES.encrypt(
        JSON.stringify(metadata),
        ENCRYPTION_KEY
      ).toString();
      await SecureStore.setItemAsync(metadataKey, encryptedMetadata);
      return true;
    } catch (error) {
      console.error('Error storing device metadata:', error);
      return false;
    }
  }

  // Retrieve device metadata
  async getDeviceMetadata(): Promise<Record<string, any> | null> {
    try {
      const metadataKey = 'simtrace_device_metadata';
      const encryptedMetadata = await SecureStore.getItemAsync(metadataKey);
      if (!encryptedMetadata) {
        return null;
      }

      const bytes = CryptoJS.AES.decrypt(encryptedMetadata, ENCRYPTION_KEY);
      const decryptedMetadata = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedMetadata);
    } catch (error) {
      console.error('Error retrieving device metadata:', error);
      return null;
    }
  }

  // Clear all device data
  async clearAllDeviceData(): Promise<boolean> {
    try {
      await this.deleteDeviceKey();
      await SecureStore.deleteItemAsync('simtrace_device_metadata');
      return true;
    } catch (error) {
      console.error('Error clearing device data:', error);
      return false;
    }
  }
}

// Singleton instance
export const deviceKeyStorageService = new DeviceKeyStorageService();
export default deviceKeyStorageService;
