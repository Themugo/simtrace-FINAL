// ── Documentation Platform ───────────────────────────────────────────────────────
// Internal architecture/APIs/queues/events/DB schemas, external API/SDK/integration docs

export interface DocumentationPage {
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

export interface APIDocumentation {
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

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  location: 'query' | 'path' | 'header';
  defaultValue?: string;
}

export interface APIRequestBody {
  contentType: string;
  schema: Record<string, any>;
  example: Record<string, any>;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  schema?: Record<string, any>;
  example?: Record<string, any>;
}

export interface APIExample {
  language: string;
  code: string;
  description: string;
}

export interface QueueDocumentation {
  id: string;
  queueName: string;
  description: string;
  eventSchema: Record<string, any>;
  producer: string;
  consumers: string[];
  examples: QueueExample[];
  version: string;
}

export interface QueueExample {
  event: Record<string, any>;
  description: string;
}

export interface DatabaseSchema {
  id: string;
  collection: string;
  description: string;
  fields: SchemaField[];
  indexes: SchemaIndex[];
  relationships: SchemaRelationship[];
  version: string;
}

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: Record<string, any>;
}

export interface SchemaIndex {
  name: string;
  fields: string[];
  unique: boolean;
  sparse: boolean;
}

export interface SchemaRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  collection: string;
  field: string;
  foreignField: string;
}

class DocumentationPlatform {
  private pages: Map<string, DocumentationPage> = new Map();
  private apiDocs: Map<string, APIDocumentation> = new Map();
  private queueDocs: Map<string, QueueDocumentation> = new Map();
  private dbSchemas: Map<string, DatabaseSchema> = new Map();

  // Create documentation page
  createPage(page: Omit<DocumentationPage, 'id' | 'lastUpdated'>): DocumentationPage {
    const docPage: DocumentationPage = {
      ...page,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date(),
    };

    this.pages.set(docPage.id, docPage);
    return docPage;
  }

  // Update page
  updatePage(pageId: string, updates: Partial<Omit<DocumentationPage, 'id'>>): DocumentationPage | null {
    const page = this.pages.get(pageId);
    if (!page) return null;

    Object.assign(page, updates);
    page.lastUpdated = new Date();
    return page;
  }

  // Get page
  getPage(pageId: string): DocumentationPage | undefined {
    return this.pages.get(pageId);
  }

  // Get page by slug
  getPageBySlug(slug: string): DocumentationPage | undefined {
    return Array.from(this.pages.values()).find(p => p.slug === slug);
  }

  // Get pages by category
  getPagesByCategory(category: DocumentationPage['category']): DocumentationPage[] {
    return Array.from(this.pages.values()).filter(p => p.category === category && p.published);
  }

  // Get all pages
  getAllPages(): DocumentationPage[] {
    return Array.from(this.pages.values());
  }

  // Add API documentation
  addAPIDocumentation(api: Omit<APIDocumentation, 'id'>): APIDocumentation {
    const apiDoc: APIDocumentation = {
      ...api,
      id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.apiDocs.set(apiDoc.id, apiDoc);
    return apiDoc;
  }

  // Get API documentation
  getAPIDocumentation(apiId: string): APIDocumentation | undefined {
    return this.apiDocs.get(apiId);
  }

  // Get API documentation by endpoint
  getAPIDocumentationByEndpoint(endpoint: string, method: string): APIDocumentation | undefined {
    return Array.from(this.apiDocs.values()).find(
      a => a.endpoint === endpoint && a.method === method
    );
  }

  // Get all API documentation
  getAllAPIDocumentation(): APIDocumentation[] {
    return Array.from(this.apiDocs.values());
  }

  // Add queue documentation
  addQueueDocumentation(queue: Omit<QueueDocumentation, 'id'>): QueueDocumentation {
    const queueDoc: QueueDocumentation = {
      ...queue,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.queueDocs.set(queueDoc.id, queueDoc);
    return queueDoc;
  }

  // Get queue documentation
  getQueueDocumentation(queueId: string): QueueDocumentation | undefined {
    return this.queueDocs.get(queueId);
  }

  // Get queue documentation by name
  getQueueDocumentationByName(queueName: string): QueueDocumentation | undefined {
    return Array.from(this.queueDocs.values()).find(q => q.queueName === queueName);
  }

  // Get all queue documentation
  getAllQueueDocumentation(): QueueDocumentation[] {
    return Array.from(this.queueDocs.values());
  }

  // Add database schema
  addDatabaseSchema(schema: Omit<DatabaseSchema, 'id'>): DatabaseSchema {
    const dbSchema: DatabaseSchema = {
      ...schema,
      id: `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.dbSchemas.set(dbSchema.id, dbSchema);
    return dbSchema;
  }

  // Get database schema
  getDatabaseSchema(schemaId: string): DatabaseSchema | undefined {
    return this.dbSchemas.get(schemaId);
  }

  // Get database schema by collection
  getDatabaseSchemaByCollection(collection: string): DatabaseSchema | undefined {
    return Array.from(this.dbSchemas.values()).find(s => s.collection === collection);
  }

  // Get all database schemas
  getAllDatabaseSchemas(): DatabaseSchema[] {
    return Array.from(this.dbSchemas.values());
  }

  // Search documentation
  search(query: string): {
    pages: DocumentationPage[];
    apis: APIDocumentation[];
    queues: QueueDocumentation[];
    schemas: DatabaseSchema[];
  } {
    const lowerQuery = query.toLowerCase();

    return {
      pages: Array.from(this.pages.values()).filter(
        p => p.title.toLowerCase().includes(lowerQuery) || 
             p.content.toLowerCase().includes(lowerQuery) ||
             p.tags.some(t => t.toLowerCase().includes(lowerQuery))
      ),
      apis: Array.from(this.apiDocs.values()).filter(
        a => a.endpoint.toLowerCase().includes(lowerQuery) ||
             a.description.toLowerCase().includes(lowerQuery)
      ),
      queues: Array.from(this.queueDocs.values()).filter(
        q => q.queueName.toLowerCase().includes(lowerQuery) ||
             q.description.toLowerCase().includes(lowerQuery)
      ),
      schemas: Array.from(this.dbSchemas.values()).filter(
        s => s.collection.toLowerCase().includes(lowerQuery) ||
             s.description.toLowerCase().includes(lowerQuery)
      ),
    };
  }

  // Get statistics
  getStatistics(): {
    totalPages: number;
    publishedPages: number;
    totalAPIDocs: number;
    totalQueueDocs: number;
    totalDBSchemas: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};

    for (const page of this.pages.values()) {
      byCategory[page.category] = (byCategory[page.category] || 0) + 1;
    }

    return {
      totalPages: this.pages.size,
      publishedPages: Array.from(this.pages.values()).filter(p => p.published).length,
      totalAPIDocs: this.apiDocs.size,
      totalQueueDocs: this.queueDocs.size,
      totalDBSchemas: this.dbSchemas.size,
      byCategory,
    };
  }

  // Initialize default documentation
  initializeDefaultDocumentation(): void {
    // Internal architecture page
    this.createPage({
      title: 'System Architecture',
      slug: 'system-architecture',
      category: 'internal',
      content: '# System Architecture\n\nThe SimTrace platform is built as a microservices architecture with the following components:\n\n- API Gateway\n- Device Tracking Service\n- Risk Scoring Service\n- AI Investigation Service\n- Telemetry Pipeline\n- Event Streaming\n\n## Technology Stack\n\n- Backend: Node.js, TypeScript\n- Database: MongoDB\n- Message Queue: Kafka\n- Cache: Redis\n- Search: Elasticsearch',
      version: '1.0.0',
      author: 'System',
      tags: ['architecture', 'system'],
      published: true,
    });

    // API documentation
    this.addAPIDocumentation({
      endpoint: '/api/v1/devices',
      method: 'GET',
      description: 'Get all devices for the authenticated user',
      parameters: [
        {
          name: 'limit',
          type: 'number',
          required: false,
          description: 'Maximum number of devices to return',
          location: 'query',
          defaultValue: '50',
        },
        {
          name: 'offset',
          type: 'number',
          required: false,
          description: 'Number of devices to skip',
          location: 'query',
          defaultValue: '0',
        },
      ],
      responses: [
        {
          statusCode: 200,
          description: 'Successful response',
          schema: {
            type: 'object',
            properties: {
              devices: { type: 'array' },
              total: { type: 'number' },
            },
          },
        },
      ],
      examples: [
        {
          language: 'curl',
          code: 'curl -H "Authorization: Bearer <token>" https://api.simtrace.com/api/v1/devices',
          description: 'Get all devices',
        },
      ],
      version: '1.0.0',
    });

    // Queue documentation
    this.addQueueDocumentation({
      queueName: 'device.detected',
      description: 'Emitted when a new device is detected',
      eventSchema: {
        deviceId: 'string',
        imei: 'string',
        timestamp: 'datetime',
        location: {
          lat: 'number',
          lng: 'number',
        },
      },
      producer: 'device-tracking-service',
      consumers: ['risk-scoring-service', 'telemetry-pipeline'],
      examples: [
        {
          event: {
            deviceId: 'device_123',
            imei: '123456789012345',
            timestamp: '2024-01-01T00:00:00Z',
            location: { lat: -1.2921, lng: 36.8219 },
          },
          description: 'Device detected in Nairobi',
        },
      ],
      version: '1.0.0',
    });

    // Database schema
    this.addDatabaseSchema({
      collection: 'devices',
      description: 'Stores device information and tracking data',
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
          description: 'International Mobile Equipment Identity',
          validation: { pattern: '^[0-9]{15}$' },
        },
        {
          name: 'userId',
          type: 'ObjectId',
          required: true,
          description: 'Owner of the device',
        },
        {
          name: 'status',
          type: 'string',
          required: true,
          description: 'Device status',
          defaultValue: 'active',
        },
        {
          name: 'lastSeen',
          type: 'datetime',
          required: true,
          description: 'Last time device was seen',
        },
      ],
      indexes: [
        {
          name: 'imei_index',
          fields: ['imei'],
          unique: true,
          sparse: false,
        },
        {
          name: 'userId_index',
          fields: ['userId'],
          unique: false,
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
  }
}

// Singleton instance
export const documentationPlatform = new DocumentationPlatform();

// Initialize default documentation
documentationPlatform.initializeDefaultDocumentation();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function createDocumentationPage(page: Omit<DocumentationPage, 'id' | 'lastUpdated'>): DocumentationPage {
  return documentationPlatform.createPage(page);
}

export function getDocumentationPage(pageId: string): DocumentationPage | undefined {
  return documentationPlatform.getPage(pageId);
}

export function getDocumentationPageBySlug(slug: string): DocumentationPage | undefined {
  return documentationPlatform.getPageBySlug(slug);
}

export function getDocumentationPagesByCategory(category: DocumentationPage['category']): DocumentationPage[] {
  return documentationPlatform.getPagesByCategory(category);
}

export function addAPIDocumentation(api: Omit<APIDocumentation, 'id'>): APIDocumentation {
  return documentationPlatform.addAPIDocumentation(api);
}

export function getAPIDocumentation(apiId: string): APIDocumentation | undefined {
  return documentationPlatform.getAPIDocumentation(apiId);
}

export function getAPIDocumentationByEndpoint(endpoint: string, method: string): APIDocumentation | undefined {
  return documentationPlatform.getAPIDocumentationByEndpoint(endpoint, method);
}

export function addQueueDocumentation(queue: Omit<QueueDocumentation, 'id'>): QueueDocumentation {
  return documentationPlatform.addQueueDocumentation(queue);
}

export function getQueueDocumentation(queueId: string): QueueDocumentation | undefined {
  return documentationPlatform.getQueueDocumentation(queueId);
}

export function addDatabaseSchema(schema: Omit<DatabaseSchema, 'id'>): DatabaseSchema {
  return documentationPlatform.addDatabaseSchema(schema);
}

export function getDatabaseSchema(schemaId: string): DatabaseSchema | undefined {
  return documentationPlatform.getDatabaseSchema(schemaId);
}

export function searchDocumentation(query: string) {
  return documentationPlatform.search(query);
}

export function getDocumentationStatistics() {
  return documentationPlatform.getStatistics();
}
