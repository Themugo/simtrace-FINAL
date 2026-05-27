# Advanced Forensics Module

Advanced forensics capabilities including metadata extraction, image analysis, location reconstruction, and timeline stitching.

## Features

- **Metadata Extraction**: Extract EXIF, file, device, and network metadata from evidence
- **Image Analysis**: Analyze images for faces, objects, text, locations, and EXIF data
- **Location Reconstruction**: Reconstruct device movement paths with gap interpolation
- **Timeline Stitching**: Stitch together timeline events and identify gaps
- **Gap Detection**: Identify data gaps in location and timeline data
- **Confidence Scoring**: Calculate confidence scores for reconstructed data

## Usage

### Extract Metadata

```typescript
import { extractForensicsMetadata } from './forensics/index.js';

const metadata = extractForensicsMetadata('evidence123', {
  type: 'image',
  deviceId: 'device456',
  caseId: 'case789',
  exif: {
    DateTime: '2024:01:15 10:30:00',
    GPS: { lat: -1.2921, lng: 36.8219 },
    Make: 'Apple',
    Model: 'iPhone 13',
  },
  fileInfo: {
    size: 2048576,
    mimeType: 'image/jpeg',
    createdAt: new Date('2024-01-15'),
    modifiedAt: new Date('2024-01-15'),
  },
});

console.log('Extracted metadata:', metadata);
```

### Analyze Image

```typescript
import { analyzeForensicsImage } from './forensics/index.js';

const analysis = analyzeForensicsImage('https://example.com/evidence.jpg');

console.log('Faces detected:', analysis.features.faces);
console.log('Objects detected:', analysis.features.objects);
console.log('Text detected:', analysis.features.text);
console.log('Locations detected:', analysis.features.locations);
console.log('EXIF data:', analysis.features.exif);
console.log('Confidence:', analysis.confidence);
```

### Reconstruct Location Path

```typescript
import { reconstructLocationPath } from './forensics/index.js';

const locationPoints = [
  { lat: -1.2921, lng: 36.8219, timestamp: new Date('2024-01-15T10:00:00') },
  { lat: -1.2930, lng: 36.8220, timestamp: new Date('2024-01-15T10:05:00') },
  { lat: -1.2940, lng: 36.8230, timestamp: new Date('2024-01-15T10:10:00') },
];

const reconstruction = reconstructLocationPath('device123', locationPoints);

console.log('Reconstructed path:', reconstruction.reconstructedPath);
console.log('Gaps detected:', reconstruction.gaps);
console.log('Time range:', reconstruction.startTime, 'to', reconstruction.endTime);
```

### Add Timeline Event

```typescript
import { addTimelineEvent } from './forensics/index.js';

const event = addTimelineEvent({
  timestamp: new Date('2024-01-15T10:00:00'),
  type: 'device_detected',
  deviceId: 'device123',
  userId: 'user456',
  data: { imei: '123456789012345', location: { lat: -1.2921, lng: 36.8219 } },
  source: 'telemetry',
});

console.log('Added timeline event:', event);
```

### Stitch Timeline

```typescript
import { stitchTimeline } from './forensics/index.js';

const timeline = stitchTimeline('device123');

console.log('Timeline stitched:', timeline.stitched);
console.log('Confidence:', timeline.confidence);
console.log('Gaps:', timeline.gaps);
console.log('Events:', timeline.events);
```

### Get Statistics

```typescript
import { getForensicsStatistics } from './forensics/index.js';

const stats = getForensicsStatistics();
console.log('Forensics statistics:', stats);
```

## Data Structures

### ForensicsMetadata

```typescript
interface ForensicsMetadata {
  id: string;
  deviceId?: string;
  caseId?: string;
  extractedAt: Date;
  metadata: Record<string, any>;
}
```

### ImageAnalysis

```typescript
interface ImageAnalysis {
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
```

### LocationReconstruction

```typescript
interface LocationReconstruction {
  deviceId: string;
  startTime: Date;
  endTime: Date;
  reconstructedPath: Array<{ lat: number; lng: number; timestamp: Date; confidence: number }>;
  gaps: Array<{ start: Date; end: Date; estimated: boolean }>;
}
```

### TimelineEvent

```typescript
interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'device_detected' | 'location_update' | 'sim_change' | 'risk_alert' | 'theft_report' | 'recovery';
  deviceId?: string;
  userId?: string;
  data: Record<string, any>;
  source: string;
}
```

### Timeline

```typescript
interface Timeline {
  deviceId: string;
  events: TimelineEvent[];
  stitched: boolean;
  confidence: number;
  gaps: Array<{ start: Date; end: Date; reason: string }>;
}
```

## Algorithms

### Path Interpolation

Linear interpolation between location points:

- Calculates intermediate points between known locations
- Assigns lower confidence to interpolated points
- Fills gaps in location data

### Timeline Stitching

Stitches timeline events chronologically:

- Sorts events by timestamp
- Identifies gaps > 2 hours
- Calculates confidence based on gap coverage
- Provides gap analysis

### Confidence Scoring

Confidence calculation based on data completeness:

- Higher confidence = less gaps
- Lower confidence = more gaps
- Interpolated points have lower confidence

## Production Integration

### Computer Vision Integration

For production image analysis, integrate with computer vision libraries:

```typescript
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

async function analyzeImageWithTensorFlow(imageUrl: string) {
  const model = await cocoSsd.load();
  const image = await loadImage(imageUrl);
  const predictions = await model.detect(image);

  return {
    objects: predictions.map(p => p.class),
    confidence: predictions.reduce((sum, p) => sum + p.score, 0) / predictions.length,
  };
}
```

### EXIF Extraction

Use exif-js for EXIF data extraction:

```typescript
import EXIF from 'exif-js';

function extractEXIF(imageElement: HTMLImageElement) {
  return new Promise((resolve) => {
    EXIF.getData(imageElement, function() {
      const allTags = EXIF.getAllTags(this);
      resolve(allTags);
    });
  });
}
```

### OCR Integration

Use Tesseract.js for text extraction:

```typescript
import Tesseract from 'tesseract.js';

async function extractTextFromImage(imageUrl: string) {
  const result = await Tesseract.recognize(imageUrl, 'eng');
  return result.data.text.split('\n').filter(t => t.trim());
}
```

## Best Practices

1. **Data Validation**: Validate all input data before processing
2. **Error Handling**: Handle errors gracefully in analysis functions
3. **Confidence Thresholds**: Set appropriate confidence thresholds
4. **Gap Analysis**: Regularly analyze gaps in data
5. **Data Retention**: Follow data retention policies
6. **Chain of Custody**: Maintain chain of custody for evidence

## Performance Considerations

1. **Image Processing**: Image analysis can be CPU-intensive
2. **Batch Operations**: Batch process images when possible
3. **Caching**: Cache analysis results
4. **Async Processing**: Use async processing for long operations
5. **Memory Management**: Clean up old data regularly

## Future Enhancements

- Integrate with TensorFlow.js for real image analysis
- Add EXIF extraction using exif-js
- Implement OCR with Tesseract.js
- Add geolocation reverse geocoding
- Implement advanced timeline analysis
- Add video forensics capabilities
- Implement chain of custody tracking
