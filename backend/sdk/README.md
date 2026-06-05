# SDK Ecosystem

SDK ecosystem for JavaScript, Mobile, and Partner SDKs with version management, usage tracking, integration management, and documentation.

## Features

- **SDK Versions**: Version management for JavaScript, Mobile, and Partner SDKs
- **Usage Tracking**: Track API calls, errors, and performance metrics
- **Integration Management**: Manage SDK integrations with configuration and features
- **Documentation**: Comprehensive documentation organized by category
- **Code Examples**: Language-specific code examples
- **Latest Version Tracking**: Automatic latest version marking

## Usage

### Create SDK Version

```typescript
import { createSDKVersion } from './sdk/index.js';

const version = createSDKVersion({
  sdkType: 'javascript',
  version: '1.2.0',
  releaseDate: new Date(),
  changelog: ['New feature', 'Bug fix', 'Performance improvement'],
  downloadUrl: 'https://cdn.simtrace.com/sdk/js/1.2.0/simtrace.js',
  documentationUrl: 'https://docs.simtrace.com/sdk/js/1.2.0',
});
```

### Get Latest SDK Version

```typescript
import { getLatestSDKVersion } from './sdk/index.js';

const latest = getLatestSDKVersion('javascript');
console.log('Latest version:', latest?.version);
console.log('Download URL:', latest?.downloadUrl);
```

### Record SDK Usage

```typescript
import { recordSDKUsage } from './sdk/index.js';

const usage = recordSDKUsage({
  organizationId: 'org_123',
  sdkType: 'javascript',
  version: '1.1.0',
  lastUsed: new Date(),
  apiCalls: 1000,
  errors: 5,
  performance: {
    avgLatency: 100,
    p95Latency: 200,
    p99Latency: 500,
  },
});
```

### Create SDK Integration

```typescript
import { createSDKIntegration } from './sdk/index.js';

const integration = createSDKIntegration({
  organizationId: 'org_123',
  sdkType: 'javascript',
  version: '1.1.0',
  config: { apiKey: 'xxx', environment: 'production' },
  features: ['tracking', 'recovery', 'analytics'],
  status: 'active',
});
```

### Get SDK Documentation

```typescript
import { getSDKDocumentation } from './sdk/index.js';

const docs = getSDKDocumentation('javascript', '1.1.0', 'getting_started');
for (const doc of docs) {
  console.log(doc.title, doc.content);
}
```

### Get SDK Examples

```typescript
import { getSDKExamples } from './sdk/index.js';

const examples = getSDKExamples('javascript', 'javascript', 'getting_started');
for (const example of examples) {
  console.log(example.title, example.code);
}
```

### Get SDK Statistics

```typescript
import { getSDKStatistics } from './sdk/index.js';

const stats = getSDKStatistics();
console.log('Total versions:', stats.totalVersions);
console.log('Active integrations:', stats.activeIntegrations);
console.log('Total usage:', stats.totalUsage);
```

## Data Structures

### SDKVersion

```typescript
interface SDKVersion {
  id: string;
  sdkType: 'javascript' | 'mobile' | 'partner';
  version: string;
  releaseDate: Date;
  changelog: string[];
  isLatest: boolean;
  downloadUrl: string;
  documentationUrl: string;
}
```

### SDKUsage

```typescript
interface SDKUsage {
  id: string;
  organizationId: string;
  sdkType: SDKVersion['sdkType'];
  version: string;
  lastUsed: Date;
  apiCalls: number;
  errors: number;
  performance: {
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
}
```

### SDKIntegration

```typescript
interface SDKIntegration {
  id: string;
  organizationId: string;
  sdkType: SDKVersion['sdkType'];
  version: string;
  config: Record<string, any>;
  features: string[];
  status: 'active' | 'inactive' | 'deprecated';
  installedAt: Date;
  updatedAt: Date;
}
```

### SDKDocumentation

```typescript
interface SDKDocumentation {
  id: string;
  sdkType: SDKVersion['sdkType'];
  version: string;
  title: string;
  content: string;
  category: 'getting_started' | 'authentication' | 'tracking' | 'recovery' | 'advanced';
  order: number;
}
```

### SDKExample

```typescript
interface SDKExample {
  id: string;
  sdkType: SDKVersion['sdkType'];
  language: string;
  title: string;
  description: string;
  code: string;
  category: SDKDocumentation['category'];
}
```

## SDK Types

### JavaScript SDK
- Web browser integration
- Node.js support
- TypeScript definitions
- CDN distribution

### Mobile SDK
- iOS (Swift/Objective-C)
- Android (Kotlin/Java)
- React Native
- Flutter

### Partner SDK
- REST API client
- Webhook support
- Batch operations
- Rate limiting

## Documentation Categories

### Getting Started
- Installation
- Initialization
- First integration

### Authentication
- API keys
- OAuth
- Token management

### Tracking
- Device tracking
- Location tracking
- Event tracking

### Recovery
- Recovery workflows
- Evidence upload
- Status updates

### Advanced
- Custom configurations
- Error handling
- Performance optimization

## Production Integration

### CDN Distribution

```typescript
// Serve SDK via CDN
const cdnUrl = 'https://cdn.simtrace.com/sdk/js/1.1.0/simtrace.js';

// In HTML
<script src="${cdnUrl}"></script>
```

### Version Management

```typescript
// Semantic versioning
function validateVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

// Compare versions
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}
```

### Usage Analytics

```typescript
// Track SDK usage in middleware
function trackSDKUsage(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const latency = Date.now() - startTime;
    recordSDKUsage({
      organizationId: req.user.organizationId,
      sdkType: req.headers['x-sdk-type'] as SDKVersion['sdkType'],
      version: req.headers['x-sdk-version'] as string,
      lastUsed: new Date(),
      apiCalls: 1,
      errors: res.statusCode >= 400 ? 1 : 0,
      performance: {
        avgLatency: latency,
        p95Latency: latency,
        p99Latency: latency,
      },
    });
  });
  
  next();
}
```

## Best Practices

1. **Semantic Versioning**: Use semantic versioning (MAJOR.MINOR.PATCH)
2. **Backward Compatibility**: Maintain backward compatibility when possible
3. **Documentation**: Keep documentation up to date with each release
4. **Examples**: Provide code examples for common use cases
5. **Deprecation**: Deprecate old versions with clear migration paths
6. **Performance**: Monitor SDK performance and optimize
7. **Security**: Rotate API keys regularly

## Performance Considerations

1. **Bundle Size**: Keep SDK bundle size minimal
2. **Lazy Loading**: Implement lazy loading for non-critical features
3. **Caching**: Cache SDK responses to reduce API calls
4. **Batching**: Batch API calls when possible
5. **Compression**: Use compression for SDK distribution

## Future Enhancements

- Add automated testing for SDKs
- Implement SDK analytics dashboard
- Add SDK deprecation warnings
- Implement SDK update notifications
- Add multi-language documentation
- Implement SDK performance monitoring
