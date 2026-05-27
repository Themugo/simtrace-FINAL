# Advanced AI Investigation Graph

Neo4j-based relationship intelligence for fraud detection and investigation.

## Features

- **Device Nodes**: Track device entities with properties
- **SIM Nodes**: Track SIM card entities
- **User Nodes**: Track user entities
- **Location Nodes**: Track location entities
- **Relationships**: Link devices to SIMs, users, and locations
- **Fraud Detection**: Detect fraud rings, coordinated theft, repeat offenders
- **Suspicious Relationships**: Find short-lived device-SIM relationships
- **Graph Queries**: Execute custom Cypher queries

## Usage

### Initialize Graph

```typescript
import { getInvestigationGraph } from './modules/graph-ai/index.js';

const graph = getInvestigationGraph({
  uri: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'password',
});

await graph.connect();
```

### Add Entities to Graph

```typescript
import { addDeviceToGraph, addSIMToGraph, linkDeviceSIM } from './modules/graph-ai/index.js';

// Add device
await addDeviceToGraph('123456789012345', {
  status: 'stolen',
  brand: 'Samsung',
  model: 'Galaxy S21',
});

// Add SIM
await addSIMToGraph('89912345678901234567', {
  operator: 'Safaricom',
  country: 'Kenya',
});

// Link device to SIM
await linkDeviceSIM('123456789012345', '89912345678901234567');
```

### Find Connected Devices

```typescript
import { findConnectedDevices } from './modules/graph-ai/index.js';

// Find devices connected to this SIM in last 6 months
const devices = await findConnectedDevices('123456789012345', 6);
console.log('Connected devices:', devices);
```

### Detect Fraud Rings

```typescript
const graph = getInvestigationGraph();

// Detect devices sharing SIMs (potential fraud rings)
const fraudRings = await graph.detectFraudRings(3);
console.log('Fraud rings:', fraudRings);
```

### Detect Coordinated Theft

```typescript
// Detect devices moving together within 24 hours, 1km radius
const coordinatedTheft = await graph.detectCoordinatedTheft(24, 1);
console.log('Coordinated theft:', coordinatedTheft);
```

### Detect Repeat Offenders

```typescript
// Detect users with 2+ stolen devices
const repeatOffenders = await graph.detectRepeatOffenders(2);
console.log('Repeat offenders:', repeatOffenders);
```

### Find Suspicious Relationships

```typescript
// Find short-lived device-SIM relationships (< 7 days)
const suspicious = await graph.findSuspiciousRelationships(7);
console.log('Suspicious relationships:', suspicious);
```

### Get Device Graph

```typescript
// Get all connected entities for a device (2 hops deep)
const graphData = await graph.getDeviceGraph('123456789012345', 2);
console.log('Nodes:', graphData.nodes);
console.log('Relationships:', graphData.relationships);
```

### Custom Cypher Query

```typescript
const result = await graph.executeQuery(
  `
  MATCH (d:Device)-[r:USES_SIM]->(s:SIM)
  WHERE s.operator = 'Safaricom'
  RETURN d.imei, s.iccid
  LIMIT 100
  `
);
console.log('Query result:', result);
```

## Graph Schema

### Nodes
- **Device**: Device entity (imei, status, brand, model, etc.)
- **SIM**: SIM card entity (iccid, operator, country, etc.)
- **User**: User entity (userId, name, email, etc.)
- **Location**: Location entity (lat, lng, type, etc.)

### Relationships
- **USES_SIM**: Device uses SIM card
- **OWNS**: User owns device
- **VISITED**: Device visited location

## AI Questions You Can Ask

- "Show devices connected to this SIM in last 6 months"
- "Detect fraud rings in my organization"
- "Find coordinated theft patterns"
- "Identify repeat offenders"
- "Find suspicious device-SIM relationships"
- "Show device movement graph"

## Deployment

### Local Development

```bash
docker run -d --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest
```

### Production

Use managed Neo4j services:
- Neo4j AuraDB
- AWS Neptune
- Azure Cosmos DB (Gremlin)

## Performance Considerations

1. **Use indexes**: Create indexes on frequently queried properties
2. **Limit query depth**: Deeper queries are slower
3. **Batch operations**: Use UNWIND for batch inserts
4. **Cache results**: Cache frequently accessed graph data
5. **Monitor query performance**: Use EXPLAIN to analyze queries

## Best Practices

1. **Always upsert**: Use MERGE instead of CREATE to avoid duplicates
2. **Add timestamps**: Track when relationships were created/updated
3. **Use relationship properties**: Store metadata on relationships
4. **Query with parameters**: Always use parameterized queries
5. **Limit results**: Always use LIMIT to prevent large result sets
