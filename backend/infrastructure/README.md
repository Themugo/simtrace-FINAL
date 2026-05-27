# High-Availability Infrastructure

High-availability infrastructure including multi-region databases, active-active services, failover systems, and autoscaling.

## Features

- **Multi-Region Support**: Manage multiple regions with health monitoring
- **Database Clusters**: Primary and replica database clusters across regions
- **Service Instances**: Track service instances with resource monitoring
- **Failover System**: Automatic failover to healthy regions
- **Autoscaling**: Automatic scaling based on CPU and memory usage
- **Health Checks**: Regular health checks for all components
- **Failover History**: Track failover events for analysis

## Usage

### Add Region

```typescript
import { addRegion } from './infrastructure/index.js';

const region = addRegion({
  id: 'ap-southeast-1',
  name: 'Asia Pacific (Singapore)',
  location: 'Asia',
  primary: false,
  status: 'active',
  latency: 200,
});
```

### Update Region Status

```typescript
import { updateRegionStatus } from './infrastructure/index.js';

const updated = updateRegionStatus('us-east-1', 'degraded');
```

### Add Database Cluster

```typescript
import { addDatabaseCluster } from './infrastructure/index.js';

const cluster = addDatabaseCluster({
  id: 'db-primary-us-east',
  regionId: 'us-east-1',
  type: 'primary',
  status: 'healthy',
  connectionString: 'mongodb://primary-us-east:27017',
});
```

### Update Database Cluster Status

```typescript
import { updateDatabaseClusterStatus } from './infrastructure/index.js';

const updated = updateDatabaseClusterStatus('db-primary-us-east', 'degraded', 5000);
```

### Add Service Instance

```typescript
import { addServiceInstance } from './infrastructure/index.js';

const instance = addServiceInstance({
  id: 'api-instance-1',
  service: 'api',
  regionId: 'us-east-1',
  status: 'running',
  cpu: 45,
  memory: 60,
  requests: 1000,
});
```

### Update Service Instance

```typescript
import { updateServiceInstance } from './infrastructure/index.js';

const updated = updateServiceInstance('api-instance-1', {
  cpu: 75,
  memory: 80,
  requests: 2000,
});
```

### Perform Health Check

```typescript
import { performHealthCheck } from './infrastructure/index.js';

const results = await performHealthCheck();

for (const result of results) {
  console.log(`Region ${result.region}: ${result.status}`);
}
```

### Perform Failover

```typescript
import { performFailover } from './infrastructure/index.js';

const result = await performFailover('Primary region degraded');

if (result.success) {
  console.log(`Failed over from ${result.from} to ${result.to}`);
}
```

### Scale Service

```typescript
import { scaleService } from './infrastructure/index.js';

// Scale up
const upResult = await scaleService('api', 'up');
console.log('New instance count:', upResult.newCount);

// Scale down
const downResult = await scaleService('api', 'down');
console.log('New instance count:', downResult.newCount);
```

### Check Autoscaling

```typescript
import { checkAutoscaling } from './infrastructure/index.js';

const result = await checkAutoscaling();

if (result.scaled) {
  console.log(`Service ${result.action === 'up' ? 'scaled up' : 'scaled down'}`);
}
```

### Get Failover History

```typescript
import { getFailoverHistory } from './infrastructure/index.js';

const history = getFailoverHistory();

for (const event of history) {
  console.log(`${event.timestamp}: ${event.from} -> ${event.to} (${event.reason})`);
}
```

### Get Statistics

```typescript
import { getHAStatistics } from './infrastructure/index.js';

const stats = getHAStatistics();
console.log('HA Statistics:', stats);
```

## Data Structures

### Region

```typescript
interface Region {
  id: string;
  name: string;
  location: string;
  primary: boolean;
  status: 'active' | 'degraded' | 'offline';
  latency: number;
  lastHealthCheck: Date;
}
```

### DatabaseCluster

```typescript
interface DatabaseCluster {
  id: string;
  regionId: string;
  type: 'primary' | 'replica';
  status: 'healthy' | 'degraded' | 'offline';
  connectionString: string;
  lag?: number;
  lastSync: Date;
}
```

### ServiceInstance

```typescript
interface ServiceInstance {
  id: string;
  service: string;
  regionId: string;
  status: 'running' | 'stopped' | 'degraded';
  cpu: number;
  memory: number;
  requests: number;
  lastHealthCheck: Date;
}
```

### FailoverConfig

```typescript
interface FailoverConfig {
  enabled: boolean;
  healthCheckInterval: number;
  failoverThreshold: number;
  autoFailover: boolean;
  regions: string[];
}
```

### AutoscalingConfig

```typescript
interface AutoscalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCPU: number;
  targetMemory: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}
```

## Algorithms

### Failover Selection

Selects new primary region based on:

1. Health status (must be active)
2. Latency (selects lowest latency)
3. Excludes current primary

### Autoscaling Decision

Scales based on resource usage:

- Scale up if CPU > target or Memory > target
- Scale down if CPU < target/2 and Memory < target/2
- Respects min/max instance limits
- Respects cooldown periods

### Health Check

Simulates health checks:

- 90% chance of healthy
- Updates region status accordingly
- Can be integrated with real health checks

## Production Integration

### AWS Integration

```typescript
import AWS from 'aws-sdk';

const ec2 = new AWS.EC2();

async function getAWSInstances() {
  const result = await ec2.describeInstances().promise();
  return result.Reservations.flatMap(r => r.Instances);
}

async function scaleAWSInstances(count: number) {
  await ec2.runInstances({
    ImageId: 'ami-12345678',
    InstanceType: 't3.medium',
    MinCount: count,
    MaxCount: count,
  }).promise();
}
```

### Kubernetes Integration

```typescript
import { KubeConfig, AppsV1Api } from '@k8sio/client-node';

const kc = new KubeConfig();
kc.loadFromDefault();
const appsV1 = new AppsV1Api(kc);

async function scaleDeployment(namespace: string, name: string, replicas: number) {
  await appsV1.patchNamespacedDeploymentScale(name, namespace, {
    spec: { replicas },
  });
}
```

### Database Replication

```typescript
// MongoDB replica set
const replicaSetConfig = {
  _id: 'rs0',
  members: [
    { _id: 0, host: 'primary-us-east:27017' },
    { _id: 1, host: 'replica-eu-west:27017' },
    { _id: 2, host: 'replica-af-south:27017' },
  ],
};
```

## Best Practices

1. **Multi-Region**: Deploy across multiple regions for redundancy
2. **Database Replication**: Use primary-replica setup with automatic failover
3. **Health Checks**: Implement regular health checks
4. **Autoscaling**: Configure appropriate min/max limits
5. **Monitoring**: Monitor all components continuously
6. **Testing**: Regularly test failover procedures
7. **Documentation**: Document failover procedures

## Performance Considerations

1. **Latency**: Consider latency between regions
2. **Data Consistency**: Balance consistency vs availability
3. **Cost**: Multi-region deployment increases costs
4. **Complexity**: HA infrastructure adds complexity
5. **Testing**: Regular testing is essential

## Future Enhancements

- Add real health check integration
- Implement database failover
- Add load balancing
- Implement circuit breakers
- Add metrics collection
- Implement automated recovery
- Add disaster recovery testing
