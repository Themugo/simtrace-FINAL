// services/ai/computerVision.ts - Computer vision for device identification
import crypto from 'crypto';

export interface DeviceImage {
  imageId: string;
  deviceId: string;
  imageData: string; // Base64 encoded
  timestamp: number;
  metadata: {
    resolution: string;
    format: string;
    size: number;
  };
}

export interface DeviceFeatures {
  featureVector: number[];
  deviceType: string;
  brand: string;
  model: string;
  color: string;
  condition: string;
  confidence: number;
}

export interface IdentificationResult {
  resultId: string;
  deviceId: string;
  matchedDeviceId?: string;
  confidence: number;
  deviceType: string;
  brand: string;
  model: string;
  color: string;
  condition: string;
  timestamp: number;
}

export class ComputerVisionService {
  private deviceImages: Map<string, DeviceImage> = new Map();
  private deviceFeatures: Map<string, DeviceFeatures> = new Map();
  private identificationResults: Map<string, IdentificationResult> = new Map();

  /**
   * Register device image for training
   */
  registerDeviceImage(
    deviceId: string,
    imageData: string,
    metadata: {
      resolution: string;
      format: string;
      size: number;
    }
  ): DeviceImage {
    const imageId = crypto.randomBytes(16).toString('hex');

    const deviceImage: DeviceImage = {
      imageId,
      deviceId,
      imageData,
      timestamp: Date.now(),
      metadata
    };

    this.deviceImages.set(imageId, deviceImage);

    // Extract features
    const features = this.extractFeatures(imageData, deviceId);
    this.deviceFeatures.set(deviceId, features);

    return deviceImage;
  }

  /**
   * Extract features from device image
   */
  private extractFeatures(imageData: string, deviceId: string): DeviceFeatures {
    // Simulate feature extraction using image hash
    const hash = crypto.createHash('sha256').update(imageData).digest('hex');
    
    // Convert hash to feature vector (normalized 0-1)
    const featureVector = hash.split('').map(char => parseInt(char, 16) / 15);

    // Simulate device classification based on features
    const deviceType = this.classifyDeviceType(featureVector);
    const brand = this.classifyBrand(featureVector);
    const model = this.classifyModel(featureVector, brand);
    const color = this.classifyColor(featureVector);
    const condition = this.classifyCondition(featureVector);
    const confidence = 0.85 + Math.random() * 0.14; // 85-99%

    return {
      featureVector,
      deviceType,
      brand,
      model,
      color,
      condition,
      confidence
    };
  }

  /**
   * Classify device type
   */
  private classifyDeviceType(features: number[]): string {
    const types = ['smartphone', 'tablet', 'laptop', 'smartwatch', 'other'];
    const index = Math.floor(features[0] * types.length);
    return types[index % types.length];
  }

  /**
   * Classify brand
   */
  private classifyBrand(features: number[]): string {
    const brands = ['Apple', 'Samsung', 'Huawei', 'Xiaomi', 'Google', 'OnePlus', 'Other'];
    const index = Math.floor(features[1] * brands.length);
    return brands[index % brands.length];
  }

  /**
   * Classify model
   */
  private classifyModel(features: number[], brand: string): string {
    const models: { [key: string]: string[] } = {
      'Apple': ['iPhone 15', 'iPhone 14', 'iPhone 13', 'iPad Pro', 'MacBook Pro'],
      'Samsung': ['Galaxy S24', 'Galaxy S23', 'Galaxy Tab', 'Galaxy Book'],
      'Huawei': ['P60 Pro', 'Mate 60', 'MatePad'],
      'Xiaomi': ['Mi 14', 'Redmi Note', 'Pad 6'],
      'Google': ['Pixel 8', 'Pixel 7', 'Pixel Tablet'],
      'OnePlus': ['OnePlus 12', 'OnePlus 11'],
      'Other': ['Unknown Model']
    };

    const brandModels = models[brand] || models['Other'];
    const index = Math.floor(features[2] * brandModels.length);
    return brandModels[index % brandModels.length];
  }

  /**
   * Classify color
   */
  private classifyColor(features: number[]): string {
    const colors = ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green', 'Other'];
    const index = Math.floor(features[3] * colors.length);
    return colors[index % colors.length];
  }

  /**
   * Classify condition
   */
  private classifyCondition(features: number[]): string {
    const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
    const index = Math.floor(features[4] * conditions.length);
    return conditions[index % conditions.length];
  }

  /**
   * Identify device from image
   */
  async identifyDevice(imageData: string): Promise<IdentificationResult> {
    const resultId = crypto.randomBytes(16).toString('hex');
    
    // Extract features from query image
    const queryFeatures = this.extractFeatures(imageData, 'query');

    // Find best match in database
    let bestMatch: { deviceId: string; similarity: number } | null = null;

    for (const [deviceId, storedFeatures] of this.deviceFeatures.entries()) {
      const similarity = this.calculateSimilarity(queryFeatures.featureVector, storedFeatures.featureVector);
      
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { deviceId, similarity };
      }
    }

    const confidence = bestMatch ? bestMatch.similarity : 0;
    const threshold = 0.85; // High threshold for identification

    const identificationResult: IdentificationResult = {
      resultId,
      deviceId: 'query',
      matchedDeviceId: bestMatch && bestMatch.similarity >= threshold ? bestMatch.deviceId : undefined,
      confidence,
      deviceType: queryFeatures.deviceType,
      brand: queryFeatures.brand,
      model: queryFeatures.model,
      color: queryFeatures.color,
      condition: queryFeatures.condition,
      timestamp: Date.now()
    };

    this.identificationResults.set(resultId, identificationResult);
    return identificationResult;
  }

  /**
   * Calculate similarity between feature vectors
   */
  private calculateSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      return 0;
    }

    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Batch identify devices
   */
  async batchIdentify(imageDataArray: string[]): Promise<IdentificationResult[]> {
    const results: IdentificationResult[] = [];

    for (const imageData of imageDataArray) {
      const result = await this.identifyDevice(imageData);
      results.push(result);
    }

    return results;
  }

  /**
   * Get device features
   */
  getDeviceFeatures(deviceId: string): DeviceFeatures | null {
    return this.deviceFeatures.get(deviceId) || null;
  }

  /**
   * Get identification history
   */
  getIdentificationHistory(limit: number = 100): IdentificationResult[] {
    return Array.from(this.identificationResults.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalImages: number;
    totalDevices: number;
    totalIdentifications: number;
    successfulMatches: number;
    averageConfidence: number;
    devicesByType: { [key: string]: number };
    devicesByBrand: { [key: string]: number };
  } {
    const images = Array.from(this.deviceImages.values());
    const results = Array.from(this.identificationResults.values());

    const devicesByType: { [key: string]: number } = {};
    const devicesByBrand: { [key: string]: number } = {};

    for (const features of this.deviceFeatures.values()) {
      devicesByType[features.deviceType] = (devicesByType[features.deviceType] || 0) + 1;
      devicesByBrand[features.brand] = (devicesByBrand[features.brand] || 0) + 1;
    }

    const successfulMatches = results.filter(r => r.matchedDeviceId).length;
    const averageConfidence = results.length > 0
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0;

    return {
      totalImages: images.length,
      totalDevices: this.deviceFeatures.size,
      totalIdentifications: results.length,
      successfulMatches,
      averageConfidence,
      devicesByType,
      devicesByBrand
    };
  }

  /**
   * Delete device images
   */
  deleteDeviceImages(deviceId: string): number {
    let deleted = 0;

    for (const [imageId, image] of this.deviceImages.entries()) {
      if (image.deviceId === deviceId) {
        this.deviceImages.delete(imageId);
        deleted++;
      }
    }

    if (deleted > 0) {
      this.deviceFeatures.delete(deviceId);
    }

    return deleted;
  }

  /**
   * Clear old results
   */
  clearOldResults(maxAge: number = 604800000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [resultId, result] of this.identificationResults.entries()) {
      if (now - result.timestamp > maxAge) {
        this.identificationResults.delete(resultId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export device features
   */
  exportFeatures(): string {
    return JSON.stringify(Array.from(this.deviceFeatures.entries()), null, 2);
  }

  /**
   * Import device features
   */
  importFeatures(features: [string, DeviceFeatures][]): number {
    let imported = 0;

    for (const [deviceId, featureData] of features) {
      if (!this.deviceFeatures.has(deviceId)) {
        this.deviceFeatures.set(deviceId, featureData);
        imported++;
      }
    }

    return imported;
  }
}

export const computerVisionService = new ComputerVisionService();
