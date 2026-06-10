// mobile/src/api/ai.ts - AI/ML API client for mobile app
const API_BASE_URL = 'https://simtrace-backend.onrender.com';

export interface DeviceBehaviorData {
  deviceId: string;
  timestamp: number;
  location: { lat: number; lng: number };
  batteryLevel: number;
  networkType: string;
  appUsage: { appId: string; duration: number }[];
  screenTime: number;
  dataUsage: number;
}

export interface AnomalyScore {
  deviceId: string;
  timestamp: number;
  anomalyScore: number;
  anomalyType: 'location' | 'usage' | 'network' | 'battery' | 'none';
  confidence: number;
  details: {
    locationAnomaly?: number;
    usageAnomaly?: number;
    networkAnomaly?: number;
    batteryAnomaly?: number;
  };
}

export interface LocationData {
  deviceId: string;
  timestamp: number;
  location: { lat: number; lng: number };
  locationType: 'home' | 'work' | 'transit' | 'public' | 'unknown';
  timeOfDay: number;
  dayOfWeek: number;
}

export interface TheftRiskScore {
  deviceId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: {
    locationRisk: number;
    timeRisk: number;
    patternRisk: number;
    historicalRisk: number;
  };
  recommendations: string[];
}

export interface BiometricData {
  userId: string;
  deviceId: string;
  timestamp: number;
  typingPattern: {
    keystrokeIntervals: number[];
    typingSpeed: number;
    errorRate: number;
  };
  usagePattern: {
    appSequence: string[];
    sessionDuration: number;
    interactionFrequency: number;
  };
  movementPattern: {
    accelerometer: number[];
    gyroscope: number[];
    touchPattern: number[];
  };
}

export interface BiometricScore {
  userId: string;
  deviceId: string;
  timestamp: number;
  matchScore: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  details: {
    typingMatch: number;
    usageMatch: number;
    movementMatch: number;
  };
}

export interface DeviceImageData {
  deviceId: string;
  imageId: string;
  timestamp: number;
  imageData: string; // Base64 encoded
  imageType: 'photo' | 'screenshot' | 'camera_capture';
  metadata: {
    resolution: { width: number; height: number };
    deviceOrientation: string;
    location?: { lat: number; lng: number };
  };
}

export interface ImageMatchResult {
  deviceId: string;
  imageId: string;
  matchScore: number;
  confidence: number;
  isDevice: boolean;
  deviceType?: string;
  deviceBrand?: string;
  details: {
    visualFeatures: number[];
    similarityToKnown: number;
  };
}

class AIApi {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/ai`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  // Anomaly Detection
  async recordBehavior(data: DeviceBehaviorData): Promise<{ success: boolean; message: string }> {
    return this.request('/anomaly/record', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async detectAnomaly(data: DeviceBehaviorData): Promise<{ anomalyScore: AnomalyScore }> {
    return this.request('/anomaly/detect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Predictive Analytics
  async recordLocation(data: LocationData): Promise<{ success: boolean; message: string }> {
    return this.request('/predictive/record-location', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRiskScore(data: LocationData): Promise<{ riskScore: TheftRiskScore }> {
    return this.request('/predictive/risk-score', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Behavioral Biometrics
  async recordBiometrics(data: BiometricData): Promise<{ success: boolean; message: string }> {
    return this.request('/biometrics/record', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyBiometrics(data: BiometricData): Promise<{ biometricScore: BiometricScore }> {
    return this.request('/biometrics/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Image Recognition
  async registerDeviceImage(data: DeviceImageData): Promise<{ success: boolean; message: string }> {
    return this.request('/image/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async identifyDevice(imageData: string): Promise<{ matchResult: ImageMatchResult }> {
    return this.request('/image/identify', {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    });
  }

  async verifyDeviceImage(deviceId: string, imageData: string): Promise<{ matchResult: ImageMatchResult }> {
    return this.request('/image/verify', {
      method: 'POST',
      body: JSON.stringify({ deviceId, imageData }),
    });
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }
}

export const aiApi = new AIApi();
