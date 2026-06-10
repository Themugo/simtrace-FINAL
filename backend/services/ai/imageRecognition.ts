// services/ai/imageRecognition.ts - AI-powered image recognition for device identification

export interface DeviceImageData {
  deviceId: string;
  imageId: string;
  timestamp: number;
  imageData: Buffer; // Image data as buffer
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
  matchScore: number; // 0-1, higher is better match
  confidence: number;
  isDevice: boolean;
  deviceType?: string;
  deviceBrand?: string;
  details: {
    visualFeatures: number[];
    similarityToKnown: number;
  };
}

class ImageRecognitionService {
  private deviceFeatures: Map<string, number[]> = new Map(); // deviceId -> features
  private knownDevices: Map<string, { type: string; brand: string }> = new Map();
  private readonly FEATURE_DIMENSION = 128;

  constructor() {
    console.log('Image recognition service initialized');
  }

  public async registerDeviceImage(data: DeviceImageData): Promise<void> {
    try {
      const features = await this.extractFeatures(data.imageData);
      this.deviceFeatures.set(data.deviceId, features);

      // In production, use object detection to identify device type and brand
      // For now, we'll store metadata
      this.knownDevices.set(data.deviceId, {
        type: 'smartphone',
        brand: 'unknown'
      });

      console.log(`Device image registered for ${data.deviceId}`);
    } catch (error) {
      console.error('Error registering device image:', error);
    }
  }

  public async identifyDevice(imageData: Buffer): Promise<ImageMatchResult> {
    try {
      const features = await this.extractFeatures(imageData);

      // Find best match among known devices
      let bestMatch: { deviceId: string; score: number } | null = null;

      for (const [deviceId, knownFeatures] of this.deviceFeatures) {
        const similarity = this.calculateCosineSimilarity(features, knownFeatures);
        
        if (!bestMatch || similarity > bestMatch.score) {
          bestMatch = { deviceId, score: similarity };
        }
      }

      if (bestMatch && bestMatch.score > 0.7) {
        const deviceInfo = this.knownDevices.get(bestMatch.deviceId);
        return {
          deviceId: bestMatch.deviceId,
          imageId: '',
          matchScore: bestMatch.score,
          confidence: bestMatch.score,
          isDevice: true,
          deviceType: deviceInfo?.type,
          deviceBrand: deviceInfo?.brand,
          details: {
            visualFeatures: features,
            similarityToKnown: bestMatch.score
          }
        };
      }

      // No match found
      return {
        deviceId: '',
        imageId: '',
        matchScore: 0,
        confidence: 0,
        isDevice: false,
        details: {
          visualFeatures: features,
          similarityToKnown: 0
        }
      };
    } catch (error) {
      console.error('Error identifying device:', error);
      return {
        deviceId: '',
        imageId: '',
        matchScore: 0,
        confidence: 0,
        isDevice: false,
        details: {
          visualFeatures: [],
          similarityToKnown: 0
        }
      };
    }
  }

  public async verifyDeviceImage(deviceId: string, imageData: Buffer): Promise<ImageMatchResult> {
    try {
      const knownFeatures = this.deviceFeatures.get(deviceId);
      
      if (!knownFeatures) {
        return {
          deviceId,
          imageId: '',
          matchScore: 0,
          confidence: 0,
          isDevice: false,
          details: {
            visualFeatures: [],
            similarityToKnown: 0
          }
        };
      }

      const currentFeatures = await this.extractFeatures(imageData);
      const similarity = this.calculateCosineSimilarity(currentFeatures, knownFeatures);

      const deviceInfo = this.knownDevices.get(deviceId);

      return {
        deviceId,
        imageId: '',
        matchScore: similarity,
        confidence: similarity,
        isDevice: similarity > 0.7,
        deviceType: deviceInfo?.type,
        deviceBrand: deviceInfo?.brand,
        details: {
          visualFeatures: currentFeatures,
          similarityToKnown: similarity
        }
      };
    } catch (error) {
      console.error('Error verifying device image:', error);
      return {
        deviceId,
        imageId: '',
        matchScore: 0,
        confidence: 0,
        isDevice: false,
        details: {
          visualFeatures: [],
          similarityToKnown: 0
        }
      };
    }
  }

  private async extractFeatures(imageData: Buffer): Promise<number[]> {
    try {
      // Simplified feature extraction using image metadata
      const features = new Array(this.FEATURE_DIMENSION).fill(0);
      
      // Use image size and simple hash as placeholder features
      const size = imageData.length;
      for (let i = 0; i < Math.min(features.length, size); i++) {
        features[i] = imageData[i] / 255.0;
      }
      
      return features;
    } catch (error) {
      console.error('Error extracting features:', error);
      return new Array(this.FEATURE_DIMENSION).fill(0);
    }
  }

  private calculateCosineSimilarity(features1: number[], features2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return Math.max(0, similarity);
  }

  public async detectDeviceType(imageData: Buffer): Promise<{ type: string; confidence: number }> {
    // In production, use a trained classifier
    // For now, return a placeholder
    return {
      type: 'smartphone',
      confidence: 0.5
    };
  }

  public async detectDeviceBrand(imageData: Buffer): Promise<{ brand: string; confidence: number }> {
    // In production, use a trained classifier
    // For now, return a placeholder
    return {
      brand: 'unknown',
      confidence: 0.5
    };
  }

  public getKnownDevices(): string[] {
    return Array.from(this.deviceFeatures.keys());
  }

  public removeDevice(deviceId: string): void {
    this.deviceFeatures.delete(deviceId);
    this.knownDevices.delete(deviceId);
  }
}

export const imageRecognitionService = new ImageRecognitionService();
