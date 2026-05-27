# Search Engine Upgrade

Advanced search engine with typo tolerance, fuzzy search, instant search, geo search, and semantic search capabilities.

## Features

- **Full-Text Search**: Search across title, description, content, and tags
- **Fuzzy Matching**: Handle typos and misspellings with Levenshtein distance
- **Typo Tolerance**: Automatic typo correction for better search results
- **Geo Search**: Search documents within a geographic radius
- **Type Filtering**: Filter results by document type
- **Custom Filters**: Apply custom metadata filters
- **Highlighting**: Generate search result highlights
- **Scoring**: Relevance-based result ranking
- **Pagination**: Efficient result pagination

## Usage

### Add Document

```typescript
import { addSearchDocument } from './search/index.js';

addSearchDocument({
  id: 'doc123',
  type: 'device',
  title: 'iPhone 13 Pro Max',
  description: 'Stolen device reported in Nairobi',
  content: 'Device was stolen from a coffee shop in Westlands',
  tags: ['stolen', 'iphone', 'nairobi'],
  location: { lat: -1.2921, lng: 36.8219 },
  metadata: {
    imei: '123456789012345',
    riskScore: 85,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Search Documents

```typescript
import { search } from './search/index.js';

const response = search({
  query: 'stolen iphone',
  type: 'device',
  limit: 20,
  fuzzy: true,
  typoTolerance: true,
});

console.log(`Found ${response.total} results in ${response.queryTime}ms`);

for (const result of response.results) {
  console.log(`${result.document.title} (score: ${result.score})`);
  if (result.highlights) {
    console.log('Highlights:', result.highlights);
  }
}
```

### Geo Search

```typescript
import { search } from './search/index.js';

const response = search({
  query: 'stolen',
  location: {
    lat: -1.2921,
    lng: 36.8219,
    radius: 10, // 10km radius
  },
  limit: 20,
});
```

### Filter by Type

```typescript
import { search } from './search/index.js';

const response = search({
  query: 'john',
  type: 'user',
  limit: 20,
});
```

### Custom Filters

```typescript
import { search } from './search/index.js';

const response = search({
  query: 'device',
  filters: {
    riskScore: 85,
    status: 'active',
  },
  limit: 20,
});
```

### Update Document

```typescript
import { updateSearchDocument } from './search/index.js';

updateSearchDocument({
  id: 'doc123',
  type: 'device',
  title: 'iPhone 13 Pro Max - Recovered',
  description: 'Device recovered in Nairobi',
  content: 'Device was recovered by police',
  tags: ['recovered', 'iphone', 'nairobi'],
  location: { lat: -1.2921, lng: 36.8219 },
  metadata: {
    imei: '123456789012345',
    riskScore: 10,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
});
```

### Remove Document

```typescript
import { removeSearchDocument } from './search/index.js';

removeSearchDocument('doc123');
```

### Get Statistics

```typescript
import { getSearchStatistics } from './search/index.js';

const stats = getSearchStatistics();
console.log('Total documents:', stats.totalDocuments);
console.log('Total words:', stats.totalWords);
console.log('By type:', stats.documentsByType);
```

## Document Structure

```typescript
interface SearchDocument {
  id: string;
  type: 'device' | 'user' | 'case' | 'organization' | 'evidence';
  title: string;
  description?: string;
  content?: string;
  tags?: string[];
  location?: { lat: number; lng: number };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Search Query Structure

```typescript
interface SearchQuery {
  query: string;
  type?: SearchDocument['type'];
  filters?: Record<string, any>;
  location?: { lat: number; lng: number; radius: number };
  limit?: number;
  offset?: number;
  fuzzy?: boolean;
  typoTolerance?: boolean;
}
```

## Search Result Structure

```typescript
interface SearchResult {
  document: SearchDocument;
  score: number;
  highlights?: Record<string, string[]>;
}
```

## Search Response Structure

```typescript
interface SearchResponse {
  results: SearchResult[];
  total: number;
  queryTime: number;
}
```

## Scoring Algorithm

The search engine uses a multi-factor scoring algorithm:

- **Title match**: +10 points
- **Description match**: +5 points
- **Content match**: +3 points
- **Tag match**: +7 points
- **Word frequency**: +1 point per occurrence
- **Recency boost**: Up to +10 points for recent documents

## Fuzzy Matching

The fuzzy matching uses Levenshtein distance to handle typos:

- Maximum distance = max(1, floor(word_length / 3))
- Example: "iphone" matches "iphne" (distance 1)
- Example: "nairobi" matches "nairbi" (distance 1)

## Geo Search

Geo search uses Haversine formula to calculate distance:

- Radius specified in kilometers
- Filters documents within the specified radius
- Useful for location-based searches

## Production Integration

For production deployments, integrate with Typesense or Elasticsearch:

### Typesense Integration

```typescript
import Typesense from 'typesense';

const typesense = new Typesense.Client({
  nodes: [{
    host: 'localhost',
    port: 8108,
    protocol: 'http',
  }],
  apiKey: 'xyz',
  connectionTimeoutSeconds: 2,
});

async function searchWithTypesense(query: string) {
  const results = await typesense.collections('devices').documents().search({
    q: query,
    query_by: 'title,description,content,tags',
    typo_tolerance: 'true',
    fuzzy: 'true',
  });

  return results;
}
```

### Elasticsearch Integration

```typescript
import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://localhost:9200' });

async function searchWithElasticsearch(query: string) {
  const results = await client.search({
    index: 'documents',
    body: {
      query: {
        multi_match: {
          query,
          fields: ['title', 'description', 'content', 'tags'],
          fuzziness: 'AUTO',
        },
      },
    },
  });

  return results;
}
```

## Best Practices

1. **Index Incrementally**: Add documents as they are created/updated
2. **Use Tags**: Add relevant tags for better search results
3. **Geo Data**: Include location data for geo search
4. **Metadata**: Use metadata for custom filters
5. **Pagination**: Use pagination for large result sets
6. **Caching**: Cache search results for common queries

## Performance Considerations

1. **In-Memory Index**: Current implementation is in-memory
2. **Batch Operations**: Batch document additions for efficiency
3. **Index Size**: Monitor index size and clean up old documents
4. **Query Optimization**: Use specific filters to reduce result sets
5. **Production**: Use Typesense/Elasticsearch for production

## Future Enhancements

- Add Typesense/Elasticsearch integration
- Implement semantic search with embeddings
- Add search suggestions/autocomplete
- Implement search analytics
- Add search result ranking customization
- Implement search result caching
- Add search query logging
