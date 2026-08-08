# Documentation Platform

Documentation platform for internal architecture, APIs, queues, database schemas, external API, SDK, and integration documentation.

## Features

- **Documentation Pages**: Create and manage documentation pages with categories
- **API Documentation**: Document API endpoints with parameters, request/response schemas, and examples
- **Queue Documentation**: Document message queues with event schemas and examples
- **Database Schemas**: Document database collections with fields, indexes, and relationships
- **Search**: Search across all documentation
- **Categories**: Organize documentation by category (internal, external, API, SDK, integration)
- **Versioning**: Track documentation versions
- **Publishing**: Control publication status of pages

## Usage

### Create Documentation Page

```typescript
import { createDocumentationPage } from './docs/index.js';

const page = createDocumentationPage({
  title: 'Getting Started',
  slug: 'getting-started',
  category: 'external',
  content: '# Getting Started\n\nWelcome to SimTrace...',
  version: '1.0.0',
  author: 'John Doe',
  tags: ['guide', 'tutorial'],
  published: true,
});
```

### Get Documentation Page

```typescript
import { getDocumentationPage, getDocumentationPageBySlug } from './docs/index.js';

const page = getDocumentationPage('doc_id');
const page = getDocumentationPageBySlug('getting-started');
```

### Get Pages by Category

```typescript
import { getDocumentationPagesByCategory } from './docs/index.js';

const pages = getDocumentationPagesByCategory('external');
```

### Add API Documentation

```typescript
import { addAPIDocumentation } from './docs/index.js';

const api = addAPIDocumentation({
  endpoint: '/api/v1/devices',
  method: 'GET',
  description: 'Get all devices',
  parameters: [
    {
      name: 'limit',
      type: 'number',
      required: false,
      description: 'Maximum number of results',
      location: 'query',
      defaultValue: '50',
    },
  ],
  responses: [
    {
      statusCode: 200,
      description: 'Successful response',
      schema: { type: 'object' },
    },
  ],
  examples: [
    {
      language: 'curl',
      code: 'curl https://api.simtrace.com/api/v1/devices',
      description: 'Get devices',
    },
  ],
  version: '1.0.0',
});
```

### Get API Documentation

```typescript
import { getAPIDocumentation, getAPIDocumentationByEndpoint } from './docs/index.js';

const api = getAPIDocumentation('api_id');
const api = getAPIDocumentationByEndpoint('/api/v1/devices', 'GET');
```

### Add Queue Documentation

```typescript
import { addQueueDocumentation } from './docs/index.js';

const queue = addQueueDocumentation({
  queueName: 'device.detected',
  description: 'Emitted when a device is detected',
  eventSchema: {
    deviceId: 'string',
    imei: 'string',
    timestamp: 'datetime',
  },
  producer: 'device-tracking-service',
  consumers: ['risk-scoring-service'],
  examples: [
    {
      event: { deviceId: '123', imei: '456', timestamp: '2024-01-01' },
      description: 'Device detected',
    },
  ],
  version: '1.0.0',
});
```

### Add Database Schema

```typescript
import { addDatabaseSchema } from './docs/index.js';

const schema = addDatabaseSchema({
  collection: 'devices',
  description: 'Device information',
  fields: [
    {
      name: '_id',
      type: 'ObjectId',
      required: true,
      description: 'Unique identifier',
    },
    {
      name: 'imei',
      type: 'string',
      required: true,
      description: 'IMEI number',
      validation: { pattern: '^[0-9]{15}$' },
    },
  ],
  indexes: [
    {
      name: 'imei_index',
      fields: ['imei'],
      unique: true,
      sparse: false,
    },
  ],
  relationships: [
    {
      type: 'one-to-many',
      collection: 'users',
      field: 'userId',
      foreignField: '_id',
    },
  ],
  version: '1.0.0',
});
```

### Search Documentation

```typescript
import { searchDocumentation } from './docs/index.js';

const results = searchDocumentation('device');
console.log('Pages:', results.pages);
console.log('APIs:', results.apis);
console.log('Queues:', results.queues);
console.log('Schemas:', results.schemas);
```

### Get Statistics

```typescript
import { getDocumentationStatistics } from './docs/index.js';

const stats = getDocumentationStatistics();
console.log('Total pages:', stats.totalPages);
console.log('Published pages:', stats.publishedPages);
console.log('By category:', stats.byCategory);
```

## Data Structures

### DocumentationPage

```typescript
interface DocumentationPage {
  id: string;
  title: string;
  slug: string;
  category: 'internal' | 'external' | 'api' | 'sdk' | 'integration';
  content: string;
  version: string;
  lastUpdated: Date;
  author: string;
  tags: string[];
  published: boolean;
}
```

### APIDocumentation

```typescript
interface APIDocumentation {
  id: string;
  endpoint: string;
  method: string;
  description: string;
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  examples: APIExample[];
  version: string;
  deprecated?: boolean;
  deprecationNote?: string;
}
```

### QueueDocumentation

```typescript
interface QueueDocumentation {
  id: string;
  queueName: string;
  description: string;
  eventSchema: Record<string, any>;
  producer: string;
  consumers: string[];
  examples: QueueExample[];
  version: string;
}
```

### DatabaseSchema

```typescript
interface DatabaseSchema {
  id: string;
  collection: string;
  description: string;
  fields: SchemaField[];
  indexes: SchemaIndex[];
  relationships: SchemaRelationship[];
  version: string;
}
```

## Documentation Categories

### Internal
- System architecture
- Internal processes
- Development guides
- Deployment procedures

### External
- User guides
- Getting started
- Feature documentation
- FAQs

### API
- API reference
- Endpoint documentation
- Authentication
- Error handling

### SDK
- SDK documentation
- Code examples
- Integration guides
- Best practices

### Integration
- Partner integrations
- Webhooks
- Third-party services
- Data exchange

## Best Practices

1. **Clear Titles**: Use descriptive, clear titles
2. **Consistent Slugs**: Use kebab-case for slugs
3. **Versioning**: Update version numbers for changes
4. **Examples**: Include code examples for APIs and queues
5. **Schemas**: Document all fields with types and descriptions
6. **Categories**: Use appropriate categories for organization
7. **Tags**: Use tags for easier searching

## Production Integration

### Static Site Generation

```typescript
import { getAllPages, getAllAPIDocumentation } from './docs/index.js';

async function generateStaticSite() {
  const pages = getAllPages();
  const apis = getAllAPIDocumentation();

  // Generate HTML pages
  for (const page of pages) {
    await generateHTMLPage(page);
  }

  // Generate API reference
  await generateAPIReference(apis);
}
```

### Markdown Export

```typescript
import { getAllPages } from './docs/index.js';

function exportToMarkdown() {
  const pages = getAllPages();

  for (const page of pages) {
    const filename = `${page.slug}.md`;
    writeFileSync(filename, page.content);
  }
}
```

### OpenAPI/Swagger Export

```typescript
import { getAllAPIDocumentation } from './docs/index.js';

function generateOpenAPI() {
  const apis = getAllAPIDocumentation();
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: 'SimTrace API',
      version: '1.0.0',
    },
    paths: {},
  };

  for (const api of apis) {
    openapi.paths[api.endpoint] = {
      [api.method.toLowerCase()]: {
        description: api.description,
        parameters: api.parameters,
        responses: api.responses.reduce((acc, r) => {
          acc[r.statusCode] = { description: r.description };
          return acc;
        }, {}),
      },
    };
  }

  return openapi;
}
```

## Future Enhancements

- Add database persistence for documentation
- Implement version history for pages
- Add markdown rendering support
- Implement collaborative editing
- Add documentation approval workflow
- Generate interactive API explorer
- Add code syntax highlighting
- Implement search with filters
