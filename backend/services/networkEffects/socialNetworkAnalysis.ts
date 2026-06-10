// services/networkEffects/socialNetworkAnalysis.ts - Social network analysis for theft patterns
import crypto from 'crypto';

export interface NetworkNode {
  nodeId: string;
  type: 'device' | 'user' | 'location' | 'imei';
  data: any;
  riskScore: number;
  connections: number;
}

export interface NetworkEdge {
  edgeId: string;
  sourceId: string;
  targetId: string;
  edgeType: 'ownership' | 'location' | 'transaction' | 'contact' | 'theft';
  weight: number;
  timestamp: number;
}

export interface TheftPattern {
  patternId: string;
  patternType: 'serial' | 'organized' | 'opportunistic' | 'professional';
  confidence: number;
  involvedNodes: string[];
  timeline: number[];
  description: string;
  detectedAt: number;
}

export interface NetworkCluster {
  clusterId: string;
  nodes: string[];
  clusterType: 'theft_ring' | 'fencing_network' | 'legitimate' | 'suspicious';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  centralNode: string;
}

export class SocialNetworkAnalysisService {
  private nodes: Map<string, NetworkNode> = new Map();
  private edges: Map<string, NetworkEdge> = new Map();
  private patterns: Map<string, TheftPattern> = new Map();
  private clusters: Map<string, NetworkCluster> = new Map();

  /**
   * Add node to network
   */
  addNode(
    type: 'device' | 'user' | 'location' | 'imei',
    data: any,
    riskScore: number = 0
  ): NetworkNode {
    const nodeId = crypto.randomBytes(16).toString('hex');

    const node: NetworkNode = {
      nodeId,
      type,
      data,
      riskScore,
      connections: 0
    };

    this.nodes.set(nodeId, node);
    return node;
  }

  /**
   * Add edge to network
   */
  addEdge(
    sourceId: string,
    targetId: string,
    edgeType: 'ownership' | 'location' | 'transaction' | 'contact' | 'theft',
    weight: number = 1
  ): NetworkEdge {
    const edgeId = crypto.randomBytes(16).toString('hex');

    const edge: NetworkEdge = {
      edgeId,
      sourceId,
      targetId,
      edgeType,
      weight,
      timestamp: Date.now()
    };

    this.edges.set(edgeId, edge);

    // Update connection counts
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);

    if (sourceNode) {
      sourceNode.connections++;
      this.nodes.set(sourceId, sourceNode);
    }

    if (targetNode) {
      targetNode.connections++;
      this.nodes.set(targetId, targetNode);
    }

    return edge;
  }

  /**
   * Analyze network for theft patterns
   */
  analyzePatterns(): TheftPattern[] {
    const patterns: TheftPattern[] = [];

    // Detect serial theft patterns (same thief, multiple devices)
    const serialPatterns = this.detectSerialTheft();
    patterns.push(...serialPatterns);

    // Detect organized crime patterns
    const organizedPatterns = this.detectOrganizedCrime();
    patterns.push(...organizedPatterns);

    // Detect professional patterns
    const professionalPatterns = this.detectProfessionalTheft();
    patterns.push(...professionalPatterns);

    // Store patterns
    for (const pattern of patterns) {
      this.patterns.set(pattern.patternId, pattern);
    }

    return patterns;
  }

  /**
   * Detect serial theft patterns
   */
  private detectSerialTheft(): TheftPattern[] {
    const patterns: TheftPattern[] = [];

    // Group theft edges by source
    const theftEdgesBySource = new Map<string, NetworkEdge[]>();
    
    for (const edge of this.edges.values()) {
      if (edge.edgeType === 'theft') {
        const edges = theftEdgesBySource.get(edge.sourceId) || [];
        edges.push(edge);
        theftEdgesBySource.set(edge.sourceId, edges);
      }
    }

    // Detect patterns (3+ thefts from same source)
    for (const [sourceId, edges] of theftEdgesBySource.entries()) {
      if (edges.length >= 3) {
        const patternId = crypto.randomBytes(16).toString('hex');
        const involvedNodes = edges.map(e => e.targetId);
        const timeline = edges.map(e => e.timestamp);

        const pattern: TheftPattern = {
          patternId,
          patternType: 'serial',
          confidence: Math.min(95, 50 + edges.length * 10),
          involvedNodes,
          timeline,
          description: `Serial theft pattern detected: ${edges.length} thefts from single source`,
          detectedAt: Date.now()
        };

        patterns.push(pattern);

        // Update risk scores
        for (const nodeId of involvedNodes) {
          const node = this.nodes.get(nodeId);
          if (node) {
            node.riskScore = Math.min(100, node.riskScore + 20);
            this.nodes.set(nodeId, node);
          }
        }
      }
    }

    return patterns;
  }

  /**
   * Detect organized crime patterns
   */
  private detectOrganizedCrime(): TheftPattern[] {
    const patterns: TheftPattern[] = [];

    // Find clusters with high connectivity
    const clusters = this.detectClusters();

    for (const cluster of clusters) {
      if (cluster.clusterType === 'theft_ring' || cluster.clusterType === 'suspicious') {
        const patternId = crypto.randomBytes(16).toString('hex');
        
        // Get timeline of thefts in cluster
        const clusterEdges = Array.from(this.edges.values())
          .filter(e => cluster.nodes.includes(e.sourceId) && e.edgeType === 'theft');
        const timeline = clusterEdges.map(e => e.timestamp);

        const pattern: TheftPattern = {
          patternId,
          patternType: 'organized',
          confidence: cluster.riskLevel === 'critical' ? 90 : cluster.riskLevel === 'high' ? 75 : 60,
          involvedNodes: cluster.nodes,
          timeline,
          description: `Organized crime pattern detected: ${cluster.nodes.length} nodes in ${cluster.clusterType} cluster`,
          detectedAt: Date.now()
        };

        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect professional theft patterns
   */
  private detectProfessionalTheft(): TheftPattern[] {
    const patterns: TheftPattern[] = [];

    // Look for rapid succession thefts with high-value targets
    const theftEdges = Array.from(this.edges.values())
      .filter(e => e.edgeType === 'theft')
      .sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 0; i < theftEdges.length - 2; i++) {
      const edge1 = theftEdges[i];
      const edge2 = theftEdges[i + 1];
      const edge3 = theftEdges[i + 2];

      // Check if 3 thefts occurred within 24 hours
      const timeDiff1 = edge2.timestamp - edge1.timestamp;
      const timeDiff2 = edge3.timestamp - edge2.timestamp;

      if (timeDiff1 < 86400000 && timeDiff2 < 86400000) {
        // Check if different sources (different thieves)
        if (edge1.sourceId !== edge2.sourceId && edge2.sourceId !== edge3.sourceId) {
          const patternId = crypto.randomBytes(16).toString('hex');
          
          const pattern: TheftPattern = {
            patternId,
            patternType: 'professional',
            confidence: 70,
            involvedNodes: [edge1.sourceId, edge2.sourceId, edge3.sourceId, edge1.targetId, edge2.targetId, edge3.targetId],
            timeline: [edge1.timestamp, edge2.timestamp, edge3.timestamp],
            description: 'Professional theft pattern detected: rapid succession thefts by different actors',
            detectedAt: Date.now()
          };

          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Detect network clusters
   */
  detectClusters(): NetworkCluster[] {
    const clusters: NetworkCluster[] = [];
    const visited = new Set<string>();

    for (const [nodeId, node] of this.nodes.entries()) {
      if (visited.has(nodeId)) continue;

      const clusterNodes = this.bfsCluster(nodeId, visited);
      
      if (clusterNodes.length > 2) {
        const clusterId = crypto.randomBytes(16).toString('hex');
        const clusterType = this.classifyCluster(clusterNodes);
        const riskLevel = this.calculateClusterRisk(clusterNodes);
        const centralNode = this.findCentralNode(clusterNodes);

        const cluster: NetworkCluster = {
          clusterId,
          nodes: clusterNodes,
          clusterType,
          riskLevel,
          centralNode
        };

        clusters.push(cluster);
        this.clusters.set(clusterId, cluster);
      }
    }

    return clusters;
  }

  /**
   * BFS to find cluster nodes
   */
  private bfsCluster(startNodeId: string, visited: Set<string>): string[] {
    const cluster: string[] = [];
    const queue: string[] = [startNodeId];
    visited.add(startNodeId);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      cluster.push(nodeId);

      // Find neighbors
      const neighbors = this.getNeighbors(nodeId);
      
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return cluster;
  }

  /**
   * Get neighbors of a node
   */
  private getNeighbors(nodeId: string): string[] {
    const neighbors: string[] = [];

    for (const edge of this.edges.values()) {
      if (edge.sourceId === nodeId) {
        neighbors.push(edge.targetId);
      } else if (edge.targetId === nodeId) {
        neighbors.push(edge.sourceId);
      }
    }

    return neighbors;
  }

  /**
   * Classify cluster type
   */
  private classifyCluster(nodeIds: string[]): 'theft_ring' | 'fencing_network' | 'legitimate' | 'suspicious' {
    const clusterEdges = Array.from(this.edges.values())
      .filter(e => nodeIds.includes(e.sourceId) && nodeIds.includes(e.targetId));

    const theftEdges = clusterEdges.filter(e => e.edgeType === 'theft');
    const totalEdges = clusterEdges.length;

    if (totalEdges === 0) return 'legitimate';

    const theftRatio = theftEdges.length / totalEdges;

    if (theftRatio > 0.5) return 'theft_ring';
    if (theftRatio > 0.3) return 'fencing_network';
    if (theftRatio > 0.1) return 'suspicious';
    return 'legitimate';
  }

  /**
   * Calculate cluster risk level
   */
  private calculateClusterRisk(nodeIds: string[]): 'low' | 'medium' | 'high' | 'critical' {
    let totalRisk = 0;

    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (node) {
        totalRisk += node.riskScore;
      }
    }

    const averageRisk = totalRisk / nodeIds.length;

    if (averageRisk >= 80) return 'critical';
    if (averageRisk >= 60) return 'high';
    if (averageRisk >= 40) return 'medium';
    return 'low';
  }

  /**
   * Find central node in cluster
   */
  private findCentralNode(nodeIds: string[]): string {
    let maxConnections = 0;
    let centralNode = nodeIds[0];

    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (node && node.connections > maxConnections) {
        maxConnections = node.connections;
        centralNode = nodeId;
      }
    }

    return centralNode;
  }

  /**
   * Get node risk score
   */
  getNodeRisk(nodeId: string): number {
    const node = this.nodes.get(nodeId);
    return node ? node.riskScore : 0;
  }

  /**
   * Get patterns for node
   */
  getPatternsForNode(nodeId: string): TheftPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.involvedNodes.includes(nodeId));
  }

  /**
   * Get cluster for node
   */
  getClusterForNode(nodeId: string): NetworkCluster | null {
    for (const cluster of this.clusters.values()) {
      if (cluster.nodes.includes(nodeId)) {
        return cluster;
      }
    }
    return null;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalNodes: number;
    totalEdges: number;
    totalPatterns: number;
    totalClusters: number;
    averageRiskScore: number;
    patternsByType: { [key: string]: number };
    clustersByType: { [key: string]: number };
  } {
    const nodes = Array.from(this.nodes.values());
    const patterns = Array.from(this.patterns.values());
    const clusters = Array.from(this.clusters.values());

    const patternsByType: { [key: string]: number } = {};
    const clustersByType: { [key: string]: number } = {};

    for (const pattern of patterns) {
      patternsByType[pattern.patternType] = (patternsByType[pattern.patternType] || 0) + 1;
    }

    for (const cluster of clusters) {
      clustersByType[cluster.clusterType] = (clustersByType[cluster.clusterType] || 0) + 1;
    }

    const averageRiskScore = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.riskScore, 0) / nodes.length
      : 0;

    return {
      totalNodes: nodes.length,
      totalEdges: this.edges.size,
      totalPatterns: patterns.length,
      totalClusters: clusters.length,
      averageRiskScore,
      patternsByType,
      clustersByType
    };
  }

  /**
   * Clear old patterns
   */
  clearOldPatterns(maxAge: number = 604800000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [patternId, pattern] of this.patterns.entries()) {
      if (now - pattern.detectedAt > maxAge) {
        this.patterns.delete(patternId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export network data
   */
  exportNetwork(): string {
    return JSON.stringify({
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      patterns: Array.from(this.patterns.values()),
      clusters: Array.from(this.clusters.values())
    }, null, 2);
  }

  /**
   * Import network data
   */
  importNetwork(data: {
    nodes?: NetworkNode[];
    edges?: NetworkEdge[];
    patterns?: TheftPattern[];
    clusters?: NetworkCluster[];
  }): number {
    let imported = 0;

    if (data.nodes) {
      for (const node of data.nodes) {
        if (!this.nodes.has(node.nodeId)) {
          this.nodes.set(node.nodeId, node);
          imported++;
        }
      }
    }

    if (data.edges) {
      for (const edge of data.edges) {
        if (!this.edges.has(edge.edgeId)) {
          this.edges.set(edge.edgeId, edge);
          imported++;
        }
      }
    }

    if (data.patterns) {
      for (const pattern of data.patterns) {
        if (!this.patterns.has(pattern.patternId)) {
          this.patterns.set(pattern.patternId, pattern);
          imported++;
        }
      }
    }

    if (data.clusters) {
      for (const cluster of data.clusters) {
        if (!this.clusters.has(cluster.clusterId)) {
          this.clusters.set(cluster.clusterId, cluster);
          imported++;
        }
      }
    }

    return imported;
  }
}

export const socialNetworkAnalysisService = new SocialNetworkAnalysisService();
