# Geospatial Intelligence Engine

Advanced geospatial analysis for theft detection, pattern recognition, and route prediction.

## Features

- **Spatial Clustering**: Detect theft hotspots, suspicious regions, device congregation
- **Route Prediction**: AI predicts likely next locations and probable routes
- **Geo Correlation**: Correlate devices, cases, suspects, and movement timelines
- **Movement Pattern Analysis**: Detect directional movement, random movement, clustered activity

## Usage

### Spatial Clustering

```typescript
import { detectSpatialClusters, detectTheftHotspots } from './modules/geo/index.js';

// Detect clusters from location points
const points = [
  { lat: -1.2921, lng: 36.8219 },
  { lat: -1.2922, lng: 36.8220 },
  { lat: -1.2923, lng: 36.8221 },
];

const clusters = detectSpatialClusters(points, 0.01, 3);
console.log('Clusters:', clusters);

// Detect theft hotspots in a region
const hotspots = await detectTheftHotspots({
  lat: -1.2921,
  lng: 36.8219,
  radiusKm: 10,
}, 30); // 30 day window
```

### Route Prediction

```typescript
import { predictRoute } from './modules/geo/index.js';

const prediction = await predictRoute('123456789012345', 24); // 24 hours ahead
console.log('Predicted locations:', prediction.predictedLocations);
console.log('Confidence:', prediction.confidence);
```

### Geo Correlation

```typescript
import { findGeoCorrelations } from './modules/geo/index.js';

const correlations = await findGeoCorrelations('123456789012345', 5, 24);
console.log('Correlated devices:', correlations);
```

### Device Congregation Detection

```typescript
import { detectDeviceCongregation } from './modules/geo/index.js';

const congregation = await detectDeviceCongregation(
  { lat: -1.2921, lng: 36.8219 },
  1, // 1km radius
  10 // minimum devices
);

console.log('Congregated devices:', congregation);
```

## Spatial Clustering Algorithm

Uses a DBSCAN-like algorithm:
- **epsilon**: Distance threshold for clustering (default: 0.01 degrees ~1km)
- **minPoints**: Minimum points to form a cluster (default: 3)

## Route Prediction

Analyzes historical movement patterns to predict future locations:
- Extracts movement patterns from historical data
- Groups similar patterns
- Calculates confidence based on pattern consistency
- Returns predicted locations with probability and estimated time

## Geo Correlation

Finds devices that were in the same area within a time window:
- Searches for nearby devices within radius
- Correlates based on spatial and temporal proximity
- Detects movement patterns (directional, random, clustered)
- Calculates correlation score

## MongoDB Geospatial Indexes

Ensure your DeviceLocation collection has geospatial indexes:

```javascript
db.devicelocations.createIndex({ location: "2dsphere" })
```

## PostGIS Alternative

For advanced geospatial operations, consider using PostGIS:
- More powerful spatial queries
- Better performance for complex operations
- Support for spatial joins and advanced functions

## Performance Considerations

1. **Use geospatial indexes**: Essential for performance
2. **Limit query radius**: Larger radius = slower queries
3. **Cache results**: Cache hotspot and correlation results
4. **Batch processing**: Process multiple devices together
5. **Time windows**: Limit time range for better performance

## Use Cases

- **Theft Hotspot Detection**: Identify areas with high theft activity
- **Recovery Prediction**: Predict likely recovery locations
- **Fraud Detection**: Detect coordinated device movements
- **Pattern Recognition**: Identify suspicious movement patterns
- **Resource Allocation**: Deploy resources to high-risk areas
