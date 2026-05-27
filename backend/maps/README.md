# Advanced Map Infrastructure

Advanced map features including heatmaps, device density, theft clusters, polygon zones, live streams, and moving trails.

## Features

- **Heatmaps**: Visualize device activity and event intensity
- **Device Density**: Calculate and display device density grids
- **Theft Clusters**: Detect theft hotspots using DBSCAN clustering
- **Polygon Zones**: Define safe, danger, restricted, and custom zones
- **Moving Trails**: Track and visualize device movement paths
- **Point-in-Polygon**: Check if points are within defined zones
- **Data Cleanup**: Automatic cleanup of old map data

## Usage

### Add Heatmap Point

```typescript
import { addHeatmapPoint } from './maps/index.js';

addHeatmapPoint({
  lat: -1.2921,
  lng: 36.8219,
  value: 85,
  timestamp: new Date(),
  deviceId: 'device123',
  type: 'theft',
}, intensity: 1, radius: 50);
```

### Get Heatmap Data

```typescript
import { getHeatmapData } from './maps/index.js';

// Get all heatmap data
const allData = getHeatmapData();

// Get data within bounds
const bounds = {
  north: -1.2,
  south: -1.4,
  east: 37.0,
  west: 36.6,
};
const boundedData = getHeatmapData(bounds);
```

### Calculate Device Density

```typescript
import { calculateDeviceDensity } from './maps/index.js';

const points = [
  { lat: -1.2921, lng: 36.8219 },
  { lat: -1.2950, lng: 36.8250 },
  { lat: -1.2900, lng: 36.8200 },
];

const density = calculateDeviceDensity(points, gridSize: 0.01);
console.log('Device density:', density);
```

### Detect Theft Clusters

```typescript
import { detectTheftClusters } from './maps/index.js';

const theftPoints = [
  { lat: -1.2921, lng: 36.8219, type: 'theft', timestamp: new Date() },
  { lat: -1.2930, lng: 36.8220, type: 'theft', timestamp: new Date() },
  { lat: -1.2915, lng: 36.8215, type: 'theft', timestamp: new Date() },
];

const clusters = detectTheftClusters(theftPoints, epsilon: 0.01, minPts: 3);
console.log('Theft clusters:', clusters);
```

### Add Polygon Zone

```typescript
import { addPolygonZone } from './maps/index.js';

const zone = addPolygonZone({
  name: 'Nairobi CBD Safe Zone',
  type: 'safe',
  coordinates: [
    { lat: -1.2850, lng: 36.8200 },
    { lat: -1.2850, lng: 36.8300 },
    { lat: -1.2950, lng: 36.8300 },
    { lat: -1.2950, lng: 36.8200 },
  ],
});
```

### Check if Point is in Zone

```typescript
import { isPointInZone, getPolygonZone } from './maps/index.js';

const zone = getPolygonZone('zone123');
const point = { lat: -1.2900, lng: 36.8250 };

if (zone) {
  const inZone = isPointInZone(point, zone);
  console.log('Point in zone:', inZone);
}
```

### Add Moving Trail

```typescript
import { addMovingTrail } from './maps/index.js';

const trail = addMovingTrail({
  deviceId: 'device123',
  points: [
    { lat: -1.2921, lng: 36.8219, timestamp: new Date('2024-01-01T10:00:00') },
    { lat: -1.2930, lng: 36.8220, timestamp: new Date('2024-01-01T10:05:00') },
    { lat: -1.2940, lng: 36.8230, timestamp: new Date('2024-01-01T10:10:00') },
  ],
  startTime: new Date('2024-01-01T10:00:00'),
  endTime: new Date('2024-01-01T10:10:00'),
  color: '#ff0000',
});
```

### Update Moving Trail

```typescript
import { updateMovingTrail } from './maps/index.js';

const updatedTrail = updateMovingTrail('device123', {
  lat: -1.2950,
  lng: 36.8240,
  timestamp: new Date('2024-01-01T10:15:00'),
});
```

### Get Statistics

```typescript
import { getMapStatistics } from './maps/index.js';

const stats = getMapStatistics();
console.log('Map statistics:', stats);
```

## Data Structures

### MapPoint

```typescript
interface MapPoint {
  lat: number;
  lng: number;
  value?: number;
  timestamp?: Date;
  deviceId?: string;
  type?: 'device' | 'theft' | 'recovery' | 'alert';
}
```

### HeatmapData

```typescript
interface HeatmapData {
  points: MapPoint[];
  intensity: number;
  radius: number;
}
```

### DeviceDensity

```typescript
interface DeviceDensity {
  lat: number;
  lng: number;
  count: number;
  radius: number;
}
```

### TheftCluster

```typescript
interface TheftCluster {
  id: string;
  center: { lat: number; lng: number };
  points: MapPoint[];
  radius: number;
  theftCount: number;
  timeRange: { start: Date; end: Date };
}
```

### PolygonZone

```typescript
interface PolygonZone {
  id: string;
  name: string;
  type: 'safe' | 'danger' | 'restricted' | 'custom';
  coordinates: { lat: number; lng: number }[];
  createdAt: Date;
  updatedAt: Date;
}
```

### MovingTrail

```typescript
interface MovingTrail {
  deviceId: string;
  points: MapPoint[];
  startTime: Date;
  endTime: Date;
  color: string;
}
```

## Algorithms

### DBSCAN Clustering

The theft cluster detection uses DBSCAN (Density-Based Spatial Clustering of Applications with Noise):

- **epsilon**: Maximum distance between points to be considered neighbors (default: 0.01 degrees)
- **minPts**: Minimum number of points to form a cluster (default: 3)

### Point-in-Polygon

Uses the ray casting algorithm to determine if a point is inside a polygon:

- Cast a ray from the point in any direction
- Count intersections with polygon edges
- Odd intersections = inside, even = outside

### Device Density

Calculates device density using a grid-based approach:

- Divide area into grid cells
- Count devices in each cell
- Return density points with counts

## Best Practices

1. **Grid Size**: Use appropriate grid size for density calculation
2. **Cluster Parameters**: Tune epsilon and minPts for your data
3. **Zone Types**: Use appropriate zone types for different purposes
4. **Trail Colors**: Use distinct colors for different device types
5. **Data Cleanup**: Regularly clean up old map data
6. **Bounds**: Use bounds to limit data transfer for large datasets

## Performance Considerations

1. **In-Memory Storage**: Current implementation is in-memory
2. **Batch Operations**: Batch point additions for efficiency
3. **Grid Size**: Smaller grid size = more accurate but slower
4. **Cluster Detection**: DBSCAN can be slow for large datasets
5. **Production**: Consider using spatial databases (PostGIS) for production

## Integration with Map Libraries

### Leaflet Integration

```typescript
import L from 'leaflet';

// Display heatmap
const heatmapLayer = L.heatLayer(heatmapData.map(p => [p.lat, p.lng, p.value]), {
  radius: 25,
  blur: 15,
  maxZoom: 12,
}).addTo(map);

// Display polygon zone
const polygon = L.polygon(zone.coordinates, {
  color: zone.type === 'safe' ? 'green' : 'red',
  fillOpacity: 0.3,
}).addTo(map);

// Display moving trail
const polyline = L.polyline(trail.points.map(p => [p.lat, p.lng]), {
  color: trail.color,
  weight: 3,
}).addTo(map);
```

### Mapbox GL Integration

```typescript
import mapboxgl from 'mapbox-gl';

// Add heatmap source
map.addSource('heatmap', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: heatmapData.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { value: p.value },
    })),
  },
});

// Add heatmap layer
map.addLayer({
  id: 'heatmap',
  type: 'heatmap',
  source: 'heatmap',
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 100, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'blue',
      0.5, 'yellow',
      1, 'red',
    ],
  },
});
```

## Future Enhancements

- Add database persistence for map data
- Integrate with PostGIS for spatial queries
- Add real-time websocket updates for live streams
- Implement advanced clustering algorithms (OPTICS, HDBSCAN)
- Add isochrone calculations
- Implement geofencing alerts
- Add map layer management
