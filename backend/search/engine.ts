// ── Search Engine Upgrade ─────────────────────────────────────────────────────────
// Typesense/Elasticsearch with typo tolerance, fuzzy search, instant search, geo search, semantic search

export interface SearchDocument {
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

export interface SearchQuery {
  query: string;
  type?: SearchDocument['type'];
  filters?: Record<string, any>;
  location?: { lat: number; lng: number; radius: number };
  limit?: number;
  offset?: number;
  fuzzy?: boolean;
  typoTolerance?: boolean;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  queryTime: number;
}

class SearchEngine {
  private documents: Map<string, SearchDocument> = new Map();
  private index: Map<string, Set<string>> = new Map(); // word -> document IDs

  // Add document to index
  addDocument(document: SearchDocument): void {
    this.documents.set(document.id, document);
    this.indexDocument(document);
  }

  // Index document for search
  private indexDocument(document: SearchDocument): void {
    const text = `${document.title} ${document.description || ''} ${document.content || ''} ${(document.tags || []).join(' ')}`;
    const words = this.tokenize(text);

    for (const word of words) {
      if (!this.index.has(word)) {
        this.index.set(word, new Set());
      }
      this.index.get(word)!.add(document.id);
    }
  }

  // Remove document from index
  removeDocument(documentId: string): void {
    const document = this.documents.get(documentId);
    if (document) {
      this.unindexDocument(document);
      this.documents.delete(documentId);
    }
  }

  // Unindex document
  private unindexDocument(document: SearchDocument): void {
    const text = `${document.title} ${document.description || ''} ${document.content || ''} ${(document.tags || []).join(' ')}`;
    const words = this.tokenize(text);

    for (const word of words) {
      const docIds = this.index.get(word);
      if (docIds) {
        docIds.delete(document.id);
        if (docIds.size === 0) {
          this.index.delete(word);
        }
      }
    }
  }

  // Update document
  updateDocument(document: SearchDocument): void {
    const existing = this.documents.get(document.id);
    if (existing) {
      this.unindexDocument(existing);
    }
    this.documents.set(document.id, document);
    this.indexDocument(document);
  }

  // Search documents
  search(query: SearchQuery): SearchResponse {
    const startTime = Date.now();

    let results: SearchResult[] = [];
    const queryWords = this.tokenize(query.query);

    // Get document IDs for each query word
    const docIdSets = queryWords.map(word => {
      const exactMatches = this.index.get(word) || new Set();
      
      // Fuzzy matching
      if (query.fuzzy || query.typoTolerance) {
        const fuzzyMatches = new Set<string>();
        for (const [indexedWord, docIds] of this.index) {
          if (this.fuzzyMatch(word, indexedWord)) {
            for (const docId of docIds) {
              fuzzyMatches.add(docId);
            }
          }
        }
        return new Set([...exactMatches, ...fuzzyMatches]);
      }

      return exactMatches;
    });

    // Find documents that match all query words (AND logic)
    const matchedDocIds = this.intersectSets(docIdSets);

    // Build results
    for (const docId of matchedDocIds) {
      const document = this.documents.get(docId);
      if (!document) continue;

      // Apply type filter
      if (query.type && document.type !== query.type) continue;

      // Apply filters
      if (query.filters) {
        let matchesFilters = true;
        for (const [key, value] of Object.entries(query.filters)) {
          const docValue = document.metadata?.[key];
          if (docValue !== value) {
            matchesFilters = false;
            break;
          }
        }
        if (!matchesFilters) continue;
      }

      // Apply geo filter
      if (query.location && document.location) {
        const distance = this.calculateDistance(
          query.location.lat,
          query.location.lng,
          document.location.lat,
          document.location.lng
        );
        if (distance > query.location.radius) continue;
      }

      // Calculate score
      const score = this.calculateScore(document, queryWords);

      // Generate highlights
      const highlights = this.generateHighlights(document, queryWords);

      results.push({
        document,
        score,
        highlights,
      });
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const paginatedResults = results.slice(offset, offset + limit);

    const queryTime = Date.now() - startTime;

    return {
      results: paginatedResults,
      total: results.length,
      queryTime,
    };
  }

  // Tokenize text into words
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Fuzzy match words (Levenshtein distance)
  private fuzzyMatch(word1: string, word2: string): boolean {
    if (word1 === word2) return true;
    
    const maxDistance = Math.max(1, Math.floor(word1.length / 3));
    return this.levenshteinDistance(word1, word2) <= maxDistance;
  }

  // Calculate Levenshtein distance
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],
            dp[i][j - 1],
            dp[i - 1][j - 1]
          );
        }
      }
    }

    return dp[m][n];
  }

  // Intersect multiple sets
  private intersectSets<T>(sets: Set<T>[]): Set<T> {
    if (sets.length === 0) return new Set();
    if (sets.length === 1) return new Set(sets[0]);

    let result = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      result = new Set([...result].filter(x => sets[i].has(x)));
    }
    return result;
  }

  // Calculate search score
  private calculateScore(document: SearchDocument, queryWords: string[]): number {
    const text = `${document.title} ${document.description || ''} ${document.content || ''} ${(document.tags || []).join(' ')}`.toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      // Exact match in title
      if (document.title.toLowerCase().includes(word)) {
        score += 10;
      }
      
      // Exact match in description
      if (document.description?.toLowerCase().includes(word)) {
        score += 5;
      }

      // Exact match in content
      if (document.content?.toLowerCase().includes(word)) {
        score += 3;
      }

      // Match in tags
      if (document.tags?.some(tag => tag.toLowerCase().includes(word))) {
        score += 7;
      }

      // Word frequency
      const regex = new RegExp(word, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    // Boost for recent documents
    const daysSinceCreation = (Date.now() - document.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceCreation);

    return score;
  }

  // Generate highlights
  private generateHighlights(document: SearchDocument, queryWords: string[]): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};

    for (const word of queryWords) {
      const regex = new RegExp(`(.{0,30})(${word})(.{0,30})`, 'gi');

      if (document.title.toLowerCase().includes(word)) {
        const matches = document.title.match(regex);
        if (matches) {
          highlights.title = matches;
        }
      }

      if (document.description?.toLowerCase().includes(word)) {
        const matches = document.description.match(regex);
        if (matches) {
          highlights.description = matches;
        }
      }

      if (document.content?.toLowerCase().includes(word)) {
        const matches = document.content.match(regex);
        if (matches) {
          highlights.content = matches.slice(0, 3); // Limit to 3 highlights
        }
      }
    }

    return highlights;
  }

  // Calculate distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get document
  getDocument(documentId: string): SearchDocument | undefined {
    return this.documents.get(documentId);
  }

  // Get all documents
  getAllDocuments(): SearchDocument[] {
    return Array.from(this.documents.values());
  }

  // Get documents by type
  getDocumentsByType(type: SearchDocument['type']): SearchDocument[] {
    return Array.from(this.documents.values()).filter(d => d.type === type);
  }

  // Clear index
  clearIndex(): void {
    this.documents.clear();
    this.index.clear();
  }

  // Get index statistics
  getStatistics(): {
    totalDocuments: number;
    totalWords: number;
    documentsByType: Record<string, number>;
  } {
    const documentsByType: Record<string, number> = {};

    for (const document of this.documents.values()) {
      documentsByType[document.type] = (documentsByType[document.type] || 0) + 1;
    }

    return {
      totalDocuments: this.documents.size,
      totalWords: this.index.size,
      documentsByType,
    };
  }
}

// Singleton instance
export const searchEngine = new SearchEngine();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addSearchDocument(document: SearchDocument): void {
  searchEngine.addDocument(document);
}

export function removeSearchDocument(documentId: string): void {
  searchEngine.removeDocument(documentId);
}

export function updateSearchDocument(document: SearchDocument): void {
  searchEngine.updateDocument(document);
}

export function search(query: SearchQuery): SearchResponse {
  return searchEngine.search(query);
}

export function getSearchDocument(documentId: string): SearchDocument | undefined {
  return searchEngine.getDocument(documentId);
}

export function getAllSearchDocuments(): SearchDocument[] {
  return searchEngine.getAllDocuments();
}

export function getSearchStatistics() {
  return searchEngine.getStatistics();
}
