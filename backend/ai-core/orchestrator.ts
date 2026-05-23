// ── AI Operating System (AI-OS) ───────────────────────────────────────────────────
// Central AI orchestration layer with shared context engine

export interface AIAgent {
  id: string;
  name: string;
  type: 'recovery' | 'fraud' | 'telecom' | 'investigation' | 'analytics' | 'recommendation';
  status: 'idle' | 'active' | 'busy' | 'error';
  capabilities: string[];
  lastActivity?: Date;
  performance: {
    tasksCompleted: number;
    avgResponseTime: number;
    successRate: number;
  };
}

export interface AIContext {
  id: string;
  organizationId: string;
  deviceContext: Map<string, DeviceContext>;
  investigationHistory: InvestigationMemory[];
  threatMemory: ThreatMemory[];
  behavioralMemory: BehavioralMemory[];
  organizationContext: OrganizationContext;
  updatedAt: Date;
}

export interface DeviceContext {
  deviceId: string;
  imei: string;
  trustScore: number;
  riskHistory: RiskEvent[];
  movementPatterns: MovementPattern[];
  knownLocations: KnownLocation[];
  lastSeen: Date;
}

export interface InvestigationMemory {
  id: string;
  caseId: string;
  summary: string;
  keyFindings: string[];
  participants: string[];
  timeline: TimelineEvent[];
  outcome: string;
  createdAt: Date;
}

export interface ThreatMemory {
  id: string;
  threatType: string;
  pattern: string;
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
}

export interface BehavioralMemory {
  id: string;
  entityType: 'device' | 'user' | 'organization' | 'location';
  entityId: string;
  patterns: BehaviorPattern[];
  anomalies: Anomaly[];
  riskFactors: RiskFactor[];
  lastUpdated: Date;
}

export interface OrganizationContext {
  organizationId: string;
  policies: Record<string, any>;
  riskThresholds: Record<string, number>;
  allowedRegions: string[];
  integrations: string[];
  preferences: Record<string, any>;
}

export interface RiskEvent {
  timestamp: Date;
  type: string;
  score: number;
  description: string;
}

export interface MovementPattern {
  pattern: string;
  frequency: number;
  confidence: number;
  locations: string[];
}

export interface KnownLocation {
  location: string;
  type: 'home' | 'work' | 'frequent' | 'suspicious';
  visits: number;
  lastVisit: Date;
}

export interface TimelineEvent {
  timestamp: Date;
  event: string;
  description: string;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  confidence: number;
}

export interface Anomaly {
  type: string;
  description: string;
  severity: number;
  detectedAt: Date;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  currentScore: number;
}

export interface AIOrchestration {
  id: string;
  type: 'agent_coordination' | 'workflow_execution' | 'analytics_processing' | 'recommendation_generation';
  agents: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

class AIOrchestrator {
  private agents: Map<string, AIAgent> = new Map();
  private contexts: Map<string, AIContext> = new Map();
  private orchestrations: Map<string, AIOrchestration> = new Map();

  // Register AI agent
  registerAgent(agent: Omit<AIAgent, 'performance'>): AIAgent {
    const aiAgent: AIAgent = {
      ...agent,
      performance: {
        tasksCompleted: 0,
        avgResponseTime: 0,
        successRate: 1.0,
      },
    };

    this.agents.set(aiAgent.id, aiAgent);
    return aiAgent;
  }

  // Get agent
  getAgent(agentId: string): AIAgent | undefined {
    return this.agents.get(agentId);
  }

  // Get agents by type
  getAgentsByType(type: AIAgent['type']): AIAgent[] {
    return Array.from(this.agents.values()).filter(a => a.type === type);
  }

  // Get available agents
  getAvailableAgents(): AIAgent[] {
    return Array.from(this.agents.values()).filter(a => a.status === 'idle' || a.status === 'active');
  }

  // Update agent status
  updateAgentStatus(agentId: string, status: AIAgent['status']): AIAgent | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    agent.status = status;
    agent.lastActivity = new Date();
    return agent;
  }

  // Record agent performance
  recordAgentPerformance(agentId: string, responseTime: number, success: boolean): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.performance.tasksCompleted++;
    
    // Update average response time
    const totalResponseTime = agent.performance.avgResponseTime * (agent.performance.tasksCompleted - 1);
    agent.performance.avgResponseTime = (totalResponseTime + responseTime) / agent.performance.tasksCompleted;

    // Update success rate
    if (success) {
      agent.performance.successRate = (agent.performance.successRate * (agent.performance.tasksCompleted - 1) + 1) / agent.performance.tasksCompleted;
    } else {
      agent.performance.successRate = (agent.performance.successRate * (agent.performance.tasksCompleted - 1)) / agent.performance.tasksCompleted;
    }
  }

  // Create or get AI context
  getOrCreateContext(organizationId: string): AIContext {
    let context = this.contexts.get(organizationId);
    
    if (!context) {
      context = {
        id: `context_${organizationId}`,
        organizationId,
        deviceContext: new Map(),
        investigationHistory: [],
        threatMemory: [],
        behavioralMemory: [],
        organizationContext: {
          organizationId,
          policies: {},
          riskThresholds: {},
          allowedRegions: [],
          integrations: [],
          preferences: {},
        },
        updatedAt: new Date(),
      };
      this.contexts.set(organizationId, context);
    }

    return context;
  }

  // Update device context
  updateDeviceContext(organizationId: string, deviceContext: DeviceContext): void {
    const context = this.getOrCreateContext(organizationId);
    context.deviceContext.set(deviceContext.deviceId, deviceContext);
    context.updatedAt = new Date();
  }

  // Add investigation memory
  addInvestigationMemory(organizationId: string, memory: Omit<InvestigationMemory, 'id' | 'createdAt'>): InvestigationMemory {
    const context = this.getOrCreateContext(organizationId);
    const investigationMemory: InvestigationMemory = {
      ...memory,
      id: `invest_mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };
    context.investigationHistory.push(investigationMemory);
    context.updatedAt = new Date();
    return investigationMemory;
  }

  // Add threat memory
  addThreatMemory(organizationId: string, memory: Omit<ThreatMemory, 'id' | 'firstSeen' | 'lastSeen' | 'occurrences'>): ThreatMemory {
    const context = this.getOrCreateContext(organizationId);
    
    // Check if threat already exists
    const existing = context.threatMemory.find(t => t.threatType === memory.threatType && t.pattern === memory.pattern);
    if (existing) {
      existing.lastSeen = new Date();
      existing.occurrences++;
      return existing;
    }

    const threatMemory: ThreatMemory = {
      ...memory,
      id: `threat_mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstSeen: new Date(),
      lastSeen: new Date(),
      occurrences: 1,
    };
    context.threatMemory.push(threatMemory);
    context.updatedAt = new Date();
    return threatMemory;
  }

  // Add behavioral memory
  addBehavioralMemory(organizationId: string, memory: Omit<BehavioralMemory, 'id' | 'lastUpdated'>): BehavioralMemory {
    const context = this.getOrCreateContext(organizationId);
    const behavioralMemory: BehavioralMemory = {
      ...memory,
      id: `behav_mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date(),
    };
    context.behavioralMemory.push(behavioralMemory);
    context.updatedAt = new Date();
    return behavioralMemory;
  }

  // Update organization context
  updateOrganizationContext(organizationId: string, updates: Partial<OrganizationContext>): void {
    const context = this.getOrCreateContext(organizationId);
    Object.assign(context.organizationContext, updates);
    context.updatedAt = new Date();
  }

  // Get context
  getContext(organizationId: string): AIContext | undefined {
    return this.contexts.get(organizationId);
  }

  // Search context
  searchContext(organizationId: string, query: string): any[] {
    const context = this.contexts.get(organizationId);
    if (!context) return [];

    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search investigation history
    for (const inv of context.investigationHistory) {
      if (inv.summary.toLowerCase().includes(lowerQuery) || inv.caseId.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'investigation', data: inv });
      }
    }

    // Search threat memory
    for (const threat of context.threatMemory) {
      if (threat.threatType.toLowerCase().includes(lowerQuery) || threat.pattern.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'threat', data: threat });
      }
    }

    return results;
  }

  // Orchestrate agents
  async orchestrate(type: AIOrchestration['type'], input: Record<string, any>): Promise<AIOrchestration> {
    const orchestration: AIOrchestration = {
      id: `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      agents: [],
      status: 'pending',
      input,
      startedAt: new Date(),
    };

    this.orchestrations.set(orchestration.id, orchestration);
    orchestration.status = 'running';

    // Select appropriate agents based on type
    const availableAgents = this.getAvailableAgents();
    switch (type) {
      case 'agent_coordination':
        orchestration.agents = availableAgents.slice(0, 3).map(a => a.id);
        break;
      case 'workflow_execution':
        orchestration.agents = availableAgents.filter(a => a.type === 'investigation' || a.type === 'recovery').map(a => a.id);
        break;
      case 'analytics_processing':
        orchestration.agents = availableAgents.filter(a => a.type === 'analytics').map(a => a.id);
        break;
      case 'recommendation_generation':
        orchestration.agents = availableAgents.filter(a => a.type === 'recommendation').map(a => a.id);
        break;
    }

    // Simulate orchestration
    await new Promise(resolve => setTimeout(resolve, 100));

    orchestration.status = 'completed';
    orchestration.completedAt = new Date();
    orchestration.output = { success: true, processed: orchestration.agents.length };

    // Update agent performance
    for (const agentId of orchestration.agents) {
      this.recordAgentPerformance(agentId, 100, true);
    }

    return orchestration;
  }

  // Get orchestration
  getOrchestration(orchestrationId: string): AIOrchestration | undefined {
    return this.orchestrations.get(orchestrationId);
  }

  // Get statistics
  getStatistics(): {
    totalAgents: number;
    activeAgents: number;
    totalContexts: number;
    totalOrchestrations: number;
    completedOrchestrations: number;
    totalInvestigationMemories: number;
    totalThreatMemories: number;
    totalBehavioralMemories: number;
  } {
    const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'active' || a.status === 'busy').length;
    const completedOrchestrations = Array.from(this.orchestrations.values()).filter(o => o.status === 'completed').length;
    const totalInvestigationMemories = Array.from(this.contexts.values()).reduce((sum, c) => sum + c.investigationHistory.length, 0);
    const totalThreatMemories = Array.from(this.contexts.values()).reduce((sum, c) => sum + c.threatMemory.length, 0);
    const totalBehavioralMemories = Array.from(this.contexts.values()).reduce((sum, c) => sum + c.behavioralMemory.length, 0);

    return {
      totalAgents: this.agents.size,
      activeAgents,
      totalContexts: this.contexts.size,
      totalOrchestrations: this.orchestrations.size,
      completedOrchestrations,
      totalInvestigationMemories,
      totalThreatMemories,
      totalBehavioralMemories,
    };
  }

  // Initialize with sample data
  initializeSampleData(): void {
    // Register sample agents
    this.registerAgent({
      id: 'agent_recovery_1',
      name: 'Recovery Agent Alpha',
      type: 'recovery',
      status: 'idle',
      capabilities: ['device_tracking', 'telecom_coordination', 'recovery_workflow'],
    });

    this.registerAgent({
      id: 'agent_fraud_1',
      name: 'Fraud Detection Agent',
      type: 'fraud',
      status: 'idle',
      capabilities: ['fraud_detection', 'pattern_analysis', 'risk_scoring'],
    });

    this.registerAgent({
      id: 'agent_telecom_1',
      name: 'Telecom Integration Agent',
      type: 'telecom',
      status: 'idle',
      capabilities: ['sim_tracking', 'carrier_communication', 'blacklist_check'],
    });

    this.registerAgent({
      id: 'agent_investigation_1',
      name: 'Investigation Agent',
      type: 'investigation',
      status: 'idle',
      capabilities: ['case_management', 'evidence_analysis', 'timeline_reconstruction'],
    });

    this.registerAgent({
      id: 'agent_analytics_1',
      name: 'Analytics Agent',
      type: 'analytics',
      status: 'idle',
      capabilities: ['data_analysis', 'reporting', 'trend_detection'],
    });

    this.registerAgent({
      id: 'agent_recommendation_1',
      name: 'Recommendation Agent',
      type: 'recommendation',
      status: 'idle',
      capabilities: ['action_recommendation', 'priority_scoring', 'resource_allocation'],
    });

    // Create sample context
    const context = this.getOrCreateContext('org_123');
    
    // Add sample device context
    context.deviceContext.set('device_1', {
      deviceId: 'device_1',
      imei: '123456789012345',
      trustScore: 85,
      riskHistory: [
        { timestamp: new Date(), type: 'location_anomaly', score: 30, description: 'Unusual location detected' },
      ],
      movementPatterns: [
        { pattern: 'home_to_work', frequency: 5, confidence: 0.9, locations: ['home', 'work'] },
      ],
      knownLocations: [
        { location: 'home', type: 'home', visits: 100, lastVisit: new Date() },
        { location: 'work', type: 'work', visits: 50, lastVisit: new Date() },
      ],
      lastSeen: new Date(),
    });

    // Add sample investigation memory
    context.investigationHistory.push({
      id: 'inv_mem_1',
      caseId: 'case_123',
      summary: 'Device theft investigation',
      keyFindings: ['SIM changed', 'Location anomaly detected'],
      participants: ['user_123', 'investigator_456'],
      timeline: [
        { timestamp: new Date(), event: 'theft_reported', description: 'Device reported stolen' },
      ],
      outcome: 'pending',
      createdAt: new Date(),
    });

    // Add sample threat memory
    context.threatMemory.push({
      id: 'threat_mem_1',
      threatType: 'sim_swap',
      pattern: 'rapid_sim_changes',
      indicators: ['multiple_sims_24h', 'carrier_hopping'],
      severity: 'high',
      firstSeen: new Date(),
      lastSeen: new Date(),
      occurrences: 5,
    });

    // Add sample behavioral memory
    context.behavioralMemory.push({
      id: 'behav_mem_1',
      entityType: 'device',
      entityId: 'device_1',
      patterns: [
        { pattern: 'regular_commute', frequency: 5, confidence: 0.95 },
      ],
      anomalies: [
        { type: 'location_anomaly', description: 'Device in unusual location', severity: 0.7, detectedAt: new Date() },
      ],
      riskFactors: [
        { factor: 'new_location', weight: 0.3, currentScore: 0.5 },
      ],
      lastUpdated: new Date(),
    });
  }
}

// Singleton instance
export const aiOrchestrator = new AIOrchestrator();

// Initialize sample data
aiOrchestrator.initializeSampleData();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function registerAIAgent(agent: Omit<AIAgent, 'performance'>): AIAgent {
  return aiOrchestrator.registerAgent(agent);
}

export function getAIContext(organizationId: string): AIContext | undefined {
  return aiOrchestrator.getContext(organizationId);
}

export function updateDeviceContext(organizationId: string, deviceContext: DeviceContext): void {
  aiOrchestrator.updateDeviceContext(organizationId, deviceContext);
}

export function addInvestigationMemory(organizationId: string, memory: Omit<InvestigationMemory, 'id' | 'createdAt'>): InvestigationMemory {
  return aiOrchestrator.addInvestigationMemory(organizationId, memory);
}

export function addThreatMemory(organizationId: string, memory: Omit<ThreatMemory, 'id' | 'firstSeen' | 'lastSeen' | 'occurrences'>): ThreatMemory {
  return aiOrchestrator.addThreatMemory(organizationId, memory);
}

export function addBehavioralMemory(organizationId: string, memory: Omit<BehavioralMemory, 'id' | 'lastUpdated'>): BehavioralMemory {
  return aiOrchestrator.addBehavioralMemory(organizationId, memory);
}

export async function orchestrateAI(type: AIOrchestration['type'], input: Record<string, any>): Promise<AIOrchestration> {
  return aiOrchestrator.orchestrate(type, input);
}

export function getAIOrchestratorStatistics() {
  return aiOrchestrator.getStatistics();
}
