// ── Advanced Forensics Module ───────────────────────────────────────────────────────
// Metadata extraction, image analysis, location reconstruction, timeline stitching

export interface ForensicsMetadata {
  id: string;
  deviceId?: string;
  caseId?: string;
  extractedAt: Date;
  metadata: Record<string, any>;
}

export interface ImageAnalysis {
  id: string;
  imageUrl: string;
  analyzedAt: Date;
  features: {
    faces?: number;
    objects?: string[];
    text?: string[];
    locations?: { lat: number; lng: number }[];
    exif?: Record<string, any>;
  };
  confidence: number;
}

export interface LocationReconstruction {
  deviceId: string;
  startTime: Date;
  endTime: Date;
  reconstructedPath: Array<{ lat: number; lng: number; timestamp: Date; confidence: number }>;
  gaps: Array<{ start: Date; end: Date; estimated: boolean }>;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'device_detected' | 'location_update' | 'sim_change' | 'risk_alert' | 'theft_report' | 'recovery';
  deviceId?: string;
  userId?: string;
  data: Record<string, any>;
  source: string;
}

export interface Timeline {
  deviceId: string;
  events: TimelineEvent[];
  stitched: boolean;
  confidence: number;
  gaps: Array<{ start: Date; end: Date; reason: string }>;
}

class ForensicsModule {
  private metadata: Map<string, ForensicsMetadata> = new Map();
  private imageAnalyses: Map<string, ImageAnalysis> = new Map();
  private locationReconstructions: Map<string, LocationReconstruction> = new Map();
  private timelines: Map<string, Timeline> = new Map();

  // Extract metadata from evidence
  extractMetadata(_evidenceId: string, evidenceData: any): ForensicsMetadata {
    const extracted: Record<string, any> = {};

    // Extract EXIF data if image
    if (evidenceData.type === 'image' && evidenceData.exif) {
      extracted.exif = {
        dateTime: evidenceData.exif.DateTime,
        gps: evidenceData.exif.GPS,
        camera: evidenceData.exif.Make,
        model: evidenceData.exif.Model,
      };
    }

    // Extract file metadata
    if (evidenceData.fileInfo) {
      extracted.fileInfo = {
        size: evidenceData.fileInfo.size,
        mimeType: evidenceData.fileInfo.mimeType,
        createdAt: evidenceData.fileInfo.createdAt,
        modifiedAt: evidenceData.fileInfo.modifiedAt,
      };
    }

    // Extract device metadata
    if (evidenceData.deviceInfo) {
      extracted.deviceInfo = {
        userAgent: evidenceData.deviceInfo.userAgent,
        platform: evidenceData.deviceInfo.platform,
        screenResolution: evidenceData.deviceInfo.screenResolution,
      };
    }

    // Extract network metadata
    if (evidenceData.networkInfo) {
      extracted.networkInfo = {
        ip: evidenceData.networkInfo.ip,
        isp: evidenceData.networkInfo.isp,
        location: evidenceData.networkInfo.location,
      };
    }

    const metadata: ForensicsMetadata = {
      id: `metadata_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deviceId: evidenceData.deviceId,
      caseId: evidenceData.caseId,
      extractedAt: new Date(),
      metadata: extracted,
    };

    this.metadata.set(metadata.id, metadata);
    return metadata;
  }

  // Analyze image
  analyzeImage(imageUrl: string): ImageAnalysis {
    // In production, this would use computer vision libraries
    // For now, we'll simulate the analysis

    const analysis: ImageAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl,
      analyzedAt: new Date(),
      features: {
        faces: Math.floor(Math.random() * 3),
        objects: ['person', 'phone', 'building'],
        text: ['Nairobi', 'Westlands'],
        locations: [{ lat: -1.2921, lng: 36.8219 }],
        exif: {
          DateTime: '2024:01:15 10:30:00',
          GPS: { lat: -1.2921, lng: 36.8219 },
          Make: 'Apple',
          Model: 'iPhone 13',
        },
      },
      confidence: 0.85,
    };

    this.imageAnalyses.set(analysis.id, analysis);
    return analysis;
  }

  // Reconstruct location path
  reconstructLocationPath(
    deviceId: string,
    locationPoints: Array<{ lat: number; lng: number; timestamp: Date }>
  ): LocationReconstruction {
    // Sort points by timestamp
    const sortedPoints = locationPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Identify gaps
    const gaps: Array<{ start: Date; end: Date; estimated: boolean }> = [];
    const reconstructedPath: Array<{ lat: number; lng: number; timestamp: Date; confidence: number }> = [];

    for (let i = 0; i < sortedPoints.length; i++) {
      const point = sortedPoints[i];
      reconstructedPath.push({
        lat: point.lat,
        lng: point.lng,
        timestamp: point.timestamp,
        confidence: 1.0,
      });

      // Check for gap to next point
      if (i < sortedPoints.length - 1) {
        const nextPoint = sortedPoints[i + 1];
        const timeDiff = nextPoint.timestamp.getTime() - point.timestamp.getTime();

        // If gap > 1 hour, mark as gap
        if (timeDiff > 3600000) {
          gaps.push({
            start: point.timestamp,
            end: nextPoint.timestamp,
            estimated: true,
          });

          // Interpolate points for the gap
          const interpolatedPoints = this.interpolatePath(point, nextPoint, 5);
          reconstructedPath.push(...interpolatedPoints);
        }
      }
    }

    const reconstruction: LocationReconstruction = {
      deviceId,
      startTime: sortedPoints[0]?.timestamp || new Date(),
      endTime: sortedPoints[sortedPoints.length - 1]?.timestamp || new Date(),
      reconstructedPath,
      gaps,
    };

    this.locationReconstructions.set(deviceId, reconstruction);
    return reconstruction;
  }

  // Interpolate path between two points
  private interpolatePath(
    start: { lat: number; lng: number; timestamp: Date },
    end: { lat: number; lng: number; timestamp: Date },
    numPoints: number
  ): Array<{ lat: number; lng: number; timestamp: Date; confidence: number }> {
    const interpolated: Array<{ lat: number; lng: number; timestamp: Date; confidence: number }> = [];
    const timeDiff = end.timestamp.getTime() - start.timestamp.getTime();
    const timeStep = timeDiff / (numPoints + 1);

    for (let i = 1; i <= numPoints; i++) {
      const ratio = i / (numPoints + 1);
      interpolated.push({
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio,
        timestamp: new Date(start.timestamp.getTime() + timeStep * i),
        confidence: 0.5, // Lower confidence for interpolated points
      });
    }

    return interpolated;
  }

  // Add timeline event
  addTimelineEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent {
    const timelineEvent: TimelineEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Get or create timeline for device
    let timeline = this.timelines.get(event.deviceId || 'default');
    if (!timeline) {
      timeline = {
        deviceId: event.deviceId || 'default',
        events: [],
        stitched: false,
        confidence: 0,
        gaps: [],
      };
    }

    timeline.events.push(timelineEvent);
    timeline.events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.timelines.set(event.deviceId || 'default', timeline);

    return timelineEvent;
  }

  // Stitch timeline
  stitchTimeline(deviceId: string): Timeline {
    const timeline = this.timelines.get(deviceId);
    if (!timeline) {
      throw new Error(`Timeline for device ${deviceId} not found`);
    }

    const gaps: Array<{ start: Date; end: Date; reason: string }> = [];

    // Identify gaps in timeline
    for (let i = 0; i < timeline.events.length - 1; i++) {
      const current = timeline.events[i];
      const next = timeline.events[i + 1];
      const timeDiff = next.timestamp.getTime() - current.timestamp.getTime();

      // If gap > 2 hours, mark as gap
      if (timeDiff > 7200000) {
        gaps.push({
          start: current.timestamp,
          end: next.timestamp,
          reason: 'Data gap > 2 hours',
        });
      }
    }

    // Calculate confidence based on gap coverage
    const totalTime = timeline.events[timeline.events.length - 1].timestamp.getTime() -
                     timeline.events[0].timestamp.getTime();
    const gapTime = gaps.reduce((sum, gap) => sum + (gap.end.getTime() - gap.start.getTime()), 0);
    const confidence = 1 - (gapTime / totalTime);

    timeline.stitched = true;
    timeline.gaps = gaps;
    timeline.confidence = Math.max(0, confidence);

    this.timelines.set(deviceId, timeline);
    return timeline;
  }

  // Get metadata
  getMetadata(metadataId: string): ForensicsMetadata | undefined {
    return this.metadata.get(metadataId);
  }

  // Get image analysis
  getImageAnalysis(analysisId: string): ImageAnalysis | undefined {
    return this.imageAnalyses.get(analysisId);
  }

  // Get location reconstruction
  getLocationReconstruction(deviceId: string): LocationReconstruction | undefined {
    return this.locationReconstructions.get(deviceId);
  }

  // Get timeline
  getTimeline(deviceId: string): Timeline | undefined {
    return this.timelines.get(deviceId);
  }

  // Get all metadata
  getAllMetadata(): ForensicsMetadata[] {
    return Array.from(this.metadata.values());
  }

  // Get all image analyses
  getAllImageAnalyses(): ImageAnalysis[] {
    return Array.from(this.imageAnalyses.values());
  }

  // Get all timelines
  getAllTimelines(): Timeline[] {
    return Array.from(this.timelines.values());
  }

  // Clear old data
  clearOldData(maxAgeDays = 30): void {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    for (const [id, metadata] of this.metadata) {
      if (metadata.extractedAt.getTime() < cutoff) {
        this.metadata.delete(id);
      }
    }

    for (const [id, analysis] of this.imageAnalyses) {
      if (analysis.analyzedAt.getTime() < cutoff) {
        this.imageAnalyses.delete(id);
      }
    }

    for (const [deviceId, reconstruction] of this.locationReconstructions) {
      if (reconstruction.endTime.getTime() < cutoff) {
        this.locationReconstructions.delete(deviceId);
      }
    }

    for (const [deviceId, timeline] of this.timelines) {
      if (timeline.events.length > 0 && 
          timeline.events[timeline.events.length - 1].timestamp.getTime() < cutoff) {
        this.timelines.delete(deviceId);
      }
    }
  }

  // Get statistics
  getStatistics(): {
    totalMetadata: number;
    totalImageAnalyses: number;
    totalLocationReconstructions: number;
    totalTimelines: number;
    totalTimelineEvents: number;
  } {
    const totalTimelineEvents = Array.from(this.timelines.values())
      .reduce((sum, timeline) => sum + timeline.events.length, 0);

    return {
      totalMetadata: this.metadata.size,
      totalImageAnalyses: this.imageAnalyses.size,
      totalLocationReconstructions: this.locationReconstructions.size,
      totalTimelines: this.timelines.size,
      totalTimelineEvents,
    };
  }
}

// Singleton instance
export const forensicsModule = new ForensicsModule();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function extractForensicsMetadata(evidenceId: string, evidenceData: any): ForensicsMetadata {
  return forensicsModule.extractMetadata(evidenceId, evidenceData);
}

export function analyzeForensicsImage(imageUrl: string): ImageAnalysis {
  return forensicsModule.analyzeImage(imageUrl);
}

export function reconstructLocationPath(deviceId: string, locationPoints: Array<{ lat: number; lng: number; timestamp: Date }>): LocationReconstruction {
  return forensicsModule.reconstructLocationPath(deviceId, locationPoints);
}

export function addTimelineEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent {
  return forensicsModule.addTimelineEvent(event);
}

export function stitchTimeline(deviceId: string): Timeline {
  return forensicsModule.stitchTimeline(deviceId);
}

export function getForensicsMetadata(metadataId: string): ForensicsMetadata | undefined {
  return forensicsModule.getMetadata(metadataId);
}

export function getImageAnalysis(analysisId: string): ImageAnalysis | undefined {
  return forensicsModule.getImageAnalysis(analysisId);
}

export function getLocationReconstruction(deviceId: string): LocationReconstruction | undefined {
  return forensicsModule.getLocationReconstruction(deviceId);
}

export function getTimeline(deviceId: string): Timeline | undefined {
  return forensicsModule.getTimeline(deviceId);
}

export function getForensicsStatistics() {
  return forensicsModule.getStatistics();
}
