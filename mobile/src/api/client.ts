// api/client.ts - Axios client configuration for API calls
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { offlineModeService } from '../services/offlineMode';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token and handle offline mode
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await SecureStore.getItemAsync('authToken');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and offline mode
    this.client.interceptors.response.use(
      (response) => {
        // Cache GET requests for offline access
        if (response.config.method?.toUpperCase() === 'GET') {
          const cacheKey = response.config.url || '';
          offlineModeService.cacheData(cacheKey, response.data);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await SecureStore.deleteItemAsync('authToken');
          // Navigate to login screen
          // This should be handled by the navigation component
        }

        // Handle offline mode for failed requests
        if (!offlineModeService.getOnlineStatus() && error.config) {
          const method = error.config.method?.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
          const endpoint = error.config.url || '';

          // For GET requests, try to return cached data
          if (method === 'GET') {
            const cachedData = await offlineModeService.getCachedData(endpoint);
            if (cachedData) {
              console.log(`Returning cached data for: ${endpoint}`);
              return Promise.resolve({ data: cachedData, status: 200, statusText: 'OK', headers: {}, config: error.config } as any);
            }
          }

          // Queue non-GET requests for later sync
          if (method !== 'GET') {
            console.log(`Queueing offline request: ${method} ${endpoint}`);
            await offlineModeService.queueRequest(method, endpoint, error.config.data);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public getClient(): AxiosInstance {
    return this.client;
  }

  public setAuthToken(token: string) {
    SecureStore.setItemAsync('authToken', token);
  }

  public async clearAuthToken() {
    await SecureStore.deleteItemAsync('authToken');
  }

  // ── Offline Mode Methods ───────────────────────────────────────────────────────
  public async getWithCache(url: string): Promise<any> {
    try {
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      // If offline, return cached data
      const cachedData = await offlineModeService.getCachedData(url);
      if (cachedData) {
        return cachedData;
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient.getClient();
