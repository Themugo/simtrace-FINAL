// services/ai/nlpEvidenceAnalysis.ts - Natural language processing for evidence analysis
import crypto from 'crypto';

export interface EvidenceDocument {
  documentId: string;
  deviceId: string;
  documentType: 'police_report' | 'witness_statement' | 'incident_report' | 'insurance_claim' | 'other';
  content: string;
  metadata: {
    author?: string;
    date?: number;
    location?: string;
    language: string;
  };
  timestamp: number;
}

export interface AnalysisResult {
  analysisId: string;
  documentId: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  entities: {
    persons: string[];
    locations: string[];
    organizations: string[];
    dates: string[];
    devices: string[];
  };
  keyPhrases: string[];
  topics: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  summary: string;
  recommendations: string[];
  timestamp: number;
}

export class NLPEvidenceAnalysisService {
  private documents: Map<string, EvidenceDocument> = new Map();
  private analysisResults: Map<string, AnalysisResult> = new Map();

  /**
   * Add evidence document
   */
  addDocument(
    deviceId: string,
    documentType: 'police_report' | 'witness_statement' | 'incident_report' | 'insurance_claim' | 'other',
    content: string,
    metadata: {
      author?: string;
      date?: number;
      location?: string;
      language?: string;
    }
  ): EvidenceDocument {
    const documentId = crypto.randomBytes(16).toString('hex');

    const document: EvidenceDocument = {
      documentId,
      deviceId,
      documentType,
      content,
      metadata: {
        language: metadata.language || 'en',
        ...metadata
      },
      timestamp: Date.now()
    };

    this.documents.set(documentId, document);
    return document;
  }

  /**
   * Analyze document
   */
  async analyzeDocument(documentId: string): Promise<AnalysisResult> {
    const document = this.documents.get(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }

    const analysisId = crypto.randomBytes(16).toString('hex');

    // Perform NLP analysis
    const sentiment = this.analyzeSentiment(document.content);
    const entities = this.extractEntities(document.content);
    const keyPhrases = this.extractKeyPhrases(document.content);
    const topics = this._extractTopics(document.content, keyPhrases);
    const riskLevel = this.assessRiskLevel(document.content, document.documentType, sentiment);
    const confidence = 0.8 + Math.random() * 0.19; // 80-99%
    const summary = this.generateSummary(document.content, keyPhrases);
    const recommendations = this.generateRecommendations(riskLevel, document.documentType, entities);

    const analysisResult: AnalysisResult = {
      analysisId,
      documentId,
      sentiment,
      entities,
      keyPhrases,
      topics,
      riskLevel,
      confidence,
      summary,
      recommendations,
      timestamp: Date.now()
    };

    this.analysisResults.set(analysisId, analysisResult);
    return analysisResult;
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const negativeWords = ['stolen', 'theft', 'lost', 'missing', 'damage', 'broken', 'crime', 'police', 'investigation'];
    const positiveWords = ['recovered', 'found', 'safe', 'secure', 'protected', 'returned', 'success'];
    
    const lowerContent = content.toLowerCase();
    
    let negativeCount = 0;
    let positiveCount = 0;

    for (const word of negativeWords) {
      if (lowerContent.includes(word)) negativeCount++;
    }

    for (const word of positiveWords) {
      if (lowerContent.includes(word)) positiveCount++;
    }

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Extract entities
   */
  private extractEntities(content: string): {
    persons: string[];
    locations: string[];
    organizations: string[];
    dates: string[];
    devices: string[];
  } {
    const entities = {
      persons: [] as string[],
      locations: [] as string[],
      organizations: [] as string[],
      dates: [] as string[],
      devices: [] as string[]
    };

    // Simulate entity extraction using patterns
    const words = content.split(/\s+/);
    
    // Extract potential names (capitalized words)
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i][0] === words[i][0].toUpperCase() && words[i + 1][0] === words[i + 1][0].toUpperCase()) {
        const name = `${words[i]} ${words[i + 1]}`;
        if (name.length > 5 && name.length < 50) {
          entities.persons.push(name);
        }
      }
    }

    // Extract locations (city names, addresses)
    const locationPatterns = /\b(?:at|in|on|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
    const locationMatches = content.match(locationPatterns);
    if (locationMatches) {
      entities.locations.push(...locationMatches.map(m => m.replace(/^(?:at|in|on|near)\s+/i, '')));
    }

    // Extract organizations
    const orgPatterns = /\b(?:Police|Department|Agency|Company|Inc|Ltd|Corp)\b/g;
    const orgMatches = content.match(orgPatterns);
    if (orgMatches) {
      entities.organizations.push(...orgMatches);
    }

    // Extract dates
    const datePatterns = /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/g;
    const dateMatches = content.match(datePatterns);
    if (dateMatches) {
      entities.dates.push(...dateMatches);
    }

    // Extract device references
    const devicePatterns = /\b(?:iPhone|Samsung|Galaxy|iPad|MacBook|Android|device|phone|tablet|laptop)\b/gi;
    const deviceMatches = content.match(devicePatterns);
    if (deviceMatches) {
      entities.devices.push(...deviceMatches);
    }

    return entities;
  }

  /**
   * Extract key phrases
   */
  private extractKeyPhrases(content: string): string[] {
    // Simulate key phrase extraction
    const words = content.split(/\s+/);
    const phrases: string[] = [];

    // Extract bigrams and trigrams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (bigram.length > 5 && bigram.length < 50) {
        phrases.push(bigram);
      }
    }

    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (trigram.length > 10 && trigram.length < 70) {
        phrases.push(trigram);
      }
    }

    // Return top phrases by frequency
    const phraseCounts = new Map<string, number>();
    for (const phrase of phrases) {
      phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
    }

    return Array.from(phraseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }

  /**
   * Extract topics
   */
  private _extractTopics(content: string, _keyPhrases: string[]): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();

    // Topic keywords
    const topicKeywords: { [key: string]: string[] } = {
      'theft': ['stolen', 'theft', 'robbery', 'burglary'],
      'damage': ['damage', 'broken', 'smashed', 'cracked'],
      'location': ['location', 'gps', 'tracking', 'where'],
      'witness': ['witness', 'saw', 'observed', 'noticed'],
      'police': ['police', 'officer', 'investigation', 'report'],
      'recovery': ['recovered', 'found', 'returned', 'recovery'],
      'insurance': ['insurance', 'claim', 'coverage', 'policy']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matchCount = keywords.filter(keyword => lowerContent.includes(keyword)).length;
      if (matchCount >= 2) {
        topics.push(topic);
      }
    }

    return topics.length > 0 ? topics : ['general'];
  }

  /**
   * Assess risk level
   */
  private assessRiskLevel(
    content: string,
    documentType: string,
    sentiment: 'positive' | 'negative' | 'neutral'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const lowerContent = content.toLowerCase();
    
    let riskScore = 0;

    // Document type risk
    const typeRisk: { [key: string]: number } = {
      'police_report': 0.3,
      'witness_statement': 0.4,
      'incident_report': 0.5,
      'insurance_claim': 0.2,
      'other': 0.1
    };
    riskScore += typeRisk[documentType] || 0.1;

    // Sentiment risk
    if (sentiment === 'negative') riskScore += 0.3;
    if (sentiment === 'neutral') riskScore += 0.1;

    // Content risk indicators
    const highRiskWords = ['stolen', 'theft', 'robbery', 'burglary', 'assault', 'weapon', 'threat'];
    const mediumRiskWords = ['lost', 'missing', 'damage', 'broken', 'suspicious'];

    for (const word of highRiskWords) {
      if (lowerContent.includes(word)) riskScore += 0.2;
    }

    for (const word of mediumRiskWords) {
      if (lowerContent.includes(word)) riskScore += 0.1;
    }

    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.5) return 'medium';
    if (riskScore < 0.7) return 'high';
    return 'critical';
  }

  /**
   * Generate summary
   */
  private generateSummary(content: string, keyPhrases: string[]): string {
    // Extract first and last sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return 'No summary available';

    const firstSentence = sentences[0].trim();
    const lastSentence = sentences[sentences.length - 1].trim();

    // Combine with key phrases
    const topPhrases = keyPhrases.slice(0, 3).join(', ');
    
    return `${firstSentence}. Key elements: ${topPhrases}. ${lastSentence}.`;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    riskLevel: string,
    documentType: string,
    entities: any
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Immediate review required');
      recommendations.push('Escalate to senior investigator');
    }

    if (documentType === 'police_report') {
      recommendations.push('Verify with law enforcement');
      recommendations.push('Cross-reference with other evidence');
    }

    if (documentType === 'witness_statement') {
      recommendations.push('Interview witness for additional details');
      recommendations.push('Corroborate with physical evidence');
    }

    if (entities.persons.length > 0) {
      recommendations.push('Follow up with identified persons');
    }

    if (entities.locations.length > 0) {
      recommendations.push('Investigate mentioned locations');
    }

    if (riskLevel === 'low' || riskLevel === 'medium') {
      recommendations.push('Add to evidence database');
      recommendations.push('Schedule follow-up review');
    }

    return recommendations;
  }

  /**
   * Batch analyze documents
   */
  async batchAnalyze(documentIds: string[]): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];

    for (const documentId of documentIds) {
      try {
        const result = await this.analyzeDocument(documentId);
        results.push(result);
      } catch (error) {
        // Skip failed analyses
      }
    }

    return results;
  }

  /**
   * Get document
   */
  getDocument(documentId: string): EvidenceDocument | null {
    return this.documents.get(documentId) || null;
  }

  /**
   * Get documents for device
   */
  getDocumentsForDevice(deviceId: string): EvidenceDocument[] {
    return Array.from(this.documents.values())
      .filter(d => d.deviceId === deviceId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get analysis result
   */
  getAnalysisResult(analysisId: string): AnalysisResult | null {
    return this.analysisResults.get(analysisId) || null;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalDocuments: number;
    totalAnalyses: number;
    documentsByType: { [key: string]: number };
    analysesByRiskLevel: { [key: string]: number };
    averageConfidence: number;
  } {
    const documents = Array.from(this.documents.values());
    const analyses = Array.from(this.analysisResults.values());

    const documentsByType: { [key: string]: number } = {};
    const analysesByRiskLevel: { [key: string]: number } = {};

    for (const doc of documents) {
      documentsByType[doc.documentType] = (documentsByType[doc.documentType] || 0) + 1;
    }

    for (const analysis of analyses) {
      analysesByRiskLevel[analysis.riskLevel] = (analysesByRiskLevel[analysis.riskLevel] || 0) + 1;
    }

    const averageConfidence = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
      : 0;

    return {
      totalDocuments: documents.length,
      totalAnalyses: analyses.length,
      documentsByType,
      analysesByRiskLevel,
      averageConfidence
    };
  }

  /**
   * Delete document
   */
  deleteDocument(documentId: string): boolean {
    const document = this.documents.get(documentId);
    
    if (document) {
      this.documents.delete(documentId);
      // Also delete associated analyses
      for (const [analysisId, analysis] of this.analysisResults.entries()) {
        if (analysis.documentId === documentId) {
          this.analysisResults.delete(analysisId);
        }
      }
      return true;
    }

    return false;
  }

  /**
   * Clear old analyses
   */
  clearOldAnalyses(maxAge: number = 2592000000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [analysisId, analysis] of this.analysisResults.entries()) {
      if (now - analysis.timestamp > maxAge) {
        this.analysisResults.delete(analysisId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export documents
   */
  exportDocuments(deviceId?: string): string {
    const documents = deviceId
      ? Array.from(this.documents.values()).filter(d => d.deviceId === deviceId)
      : Array.from(this.documents.values());
    
    return JSON.stringify(documents, null, 2);
  }

  /**
   * Import documents
   */
  importDocuments(documents: EvidenceDocument[]): number {
    let imported = 0;

    for (const document of documents) {
      if (!this.documents.has(document.documentId)) {
        this.documents.set(document.documentId, document);
        imported++;
      }
    }

    return imported;
  }
}

export const nlpEvidenceAnalysisService = new NLPEvidenceAnalysisService();
