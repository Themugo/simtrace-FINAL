// ── Advanced Automation Engine ───────────────────────────────────────────────────────
// Rule engine for automation workflows, escalation chains, and recovery workflows

import { emit } from '../../events/index.js';

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
}

export interface RuleCondition {
  type: 'risk_threshold' | 'sim_change' | 'location_change' | 'time_window' | 'custom';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
  field?: string;
}

export interface RuleAction {
  type: 'notify' | 'alert' | 'freeze_device' | 'create_case' | 'escalate' | 'custom';
  params: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  type: 'escalation' | 'recovery' | 'alert' | 'custom';
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'completed';
  currentStep: number;
  startTime: Date;
  endTime?: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
}

class AutomationEngine {
  private rules: Map<string, Rule> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private running = false;

  constructor() {
    this.setupDefaultRules();
    this.setupEventListeners();
  }

  // Setup default rules
  private setupDefaultRules(): void {
    // Rule: SIM change AND risk > 80 → notify investigator + freeze device
    this.addRule({
      id: 'rule_sim_high_risk',
      name: 'SIM Change with High Risk',
      enabled: true,
      priority: 1,
      conditions: [
        { type: 'sim_change', operator: 'eq', value: true },
        { type: 'risk_threshold', operator: 'gt', value: 80 },
      ],
      actions: [
        { type: 'notify', params: { recipients: ['investigator'], message: 'SIM changed with high risk' } },
        { type: 'freeze_device', params: { reason: 'SIM change with high risk' } },
      ],
    });

    // Rule: Risk > 90 → create case + escalate
    this.addRule({
      id: 'rule_critical_risk',
      name: 'Critical Risk Alert',
      enabled: true,
      priority: 0, // Highest priority
      conditions: [
        { type: 'risk_threshold', operator: 'gte', value: 90 },
      ],
      actions: [
        { type: 'create_case', params: { priority: 'critical' } },
        { type: 'escalate', params: { level: 'immediate' } },
      ],
    });

    // Rule: Impossible travel → alert + create case
    this.addRule({
      id: 'rule_impossible_travel',
      name: 'Impossible Travel Detection',
      enabled: true,
      priority: 2,
      conditions: [
        { type: 'custom', operator: 'eq', value: 'impossible_travel' },
      ],
      actions: [
        { type: 'alert', params: { type: 'impossible_travel' } },
        { type: 'create_case', params: { priority: 'high' } },
      ],
    });
  }

  // Setup event listeners
  private setupEventListeners(): void {
    // Listen to risk calculated events
    emit.on('risk.calculated', (data) => {
      this.evaluateRules('risk.calculated', data);
    });

    // Listen to SIM change events
    emit.on('sim.changed', (data) => {
      this.evaluateRules('sim.changed', data);
    });

    // Listen to high risk events
    emit.on('risk.high', (data) => {
      this.evaluateRules('risk.high', data);
    });
  }

  // Add rule
  addRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
  }

  // Remove rule
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  // Enable/disable rule
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // Evaluate rules against event data
  private evaluateRules(eventType: string, data: any): void {
    const sortedRules = Array.from(this.rules.values())
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      if (this.evaluateConditions(rule.conditions, eventType, data)) {
        this.executeActions(rule.actions, data);
        break; // Only execute first matching rule (by priority)
      }
    }
  }

  // Evaluate rule conditions
  private evaluateConditions(conditions: RuleCondition[], eventType: string, data: any): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, eventType, data)) {
        return false;
      }
    }
    return true;
  }

  // Evaluate single condition
  private evaluateCondition(condition: RuleCondition, eventType: string, data: any): boolean {
    switch (condition.type) {
      case 'risk_threshold':
        const riskScore = data.riskAssessment?.overallScore || 0;
        return this.compareValues(riskScore, condition.operator, condition.value);

      case 'sim_change':
        return eventType === 'sim.changed';

      case 'location_change':
        return eventType === 'location.detected';

      case 'time_window':
        const timestamp = new Date(data.timestamp);
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        return this.compareValues(diff, condition.operator, condition.value);

      case 'custom':
        return data.type === condition.value || data.reason === condition.value;

      default:
        return false;
    }
  }

  // Compare values based on operator
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'gt':
        return actual > expected;
      case 'lt':
        return actual < expected;
      case 'gte':
        return actual >= expected;
      case 'lte':
        return actual <= expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'contains':
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  // Execute rule actions
  private async executeActions(actions: RuleAction[], data: any): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action, data);
    }
  }

  // Execute single action
  private async executeAction(action: RuleAction, data: any): Promise<void> {
    switch (action.type) {
      case 'notify':
        await this.notifyRecipients(action.params, data);
        break;

      case 'alert':
        await this.sendAlert(action.params, data);
        break;

      case 'freeze_device':
        await this.freezeDevice(data.imei, action.params.reason);
        break;

      case 'create_case':
        await this.createCase(data, action.params);
        break;

      case 'escalate':
        await this.escalate(data, action.params);
        break;

      case 'custom':
        await this.executeCustomAction(action.params, data);
        break;
    }
  }

  // Notify recipients
  private async notifyRecipients(params: Record<string, any>, data: any): Promise<void> {
    emit('automation.notify', {
      recipients: params.recipients,
      message: params.message,
      data,
    });
  }

  // Send alert
  private async sendAlert(params: Record<string, any>, data: any): Promise<void> {
    emit('automation.alert', {
      type: params.type,
      severity: params.severity || 'high',
      data,
    });
  }

  // Freeze device
  private async freezeDevice(imei: string, reason: string): Promise<void> {
    emit('automation.freeze_device', {
      imei,
      reason,
      timestamp: new Date(),
    });
  }

  // Create case
  private async createCase(data: any, params: Record<string, any>): Promise<void> {
    emit('automation.create_case', {
      imei: data.imei,
      priority: params.priority || 'medium',
      data,
      timestamp: new Date(),
    });
  }

  // Escalate
  private async escalate(data: any, params: Record<string, any>): Promise<void> {
    emit('automation.escalate', {
      imei: data.imei,
      level: params.level || 'normal',
      data,
      timestamp: new Date(),
    });
  }

  // Execute custom action
  private async executeCustomAction(params: Record<string, any>, data: any): Promise<void> {
    emit('automation.custom', {
      action: params.action,
      params,
      data,
      timestamp: new Date(),
    });
  }

  // Create workflow
  createWorkflow(workflow: Omit<Workflow, 'status' | 'currentStep' | 'startTime'>): string {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newWorkflow: Workflow = {
      ...workflow,
      id,
      status: 'active',
      currentStep: 0,
      startTime: new Date(),
    };

    this.workflows.set(id, newWorkflow);
    this.executeWorkflow(id);

    return id;
  }

  // Execute workflow
  private async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.status !== 'active') return;

    const step = workflow.steps[workflow.currentStep];
    if (!step) {
      // Workflow completed
      workflow.status = 'completed';
      workflow.endTime = new Date();
      emit('workflow.completed', { workflowId, workflow });
      return;
    }

    step.status = 'running';
    step.startTime = new Date();

    try {
      await this.executeWorkflowStep(step);
      step.status = 'completed';
      step.endTime = new Date();
      workflow.currentStep++;

      // Execute next step
      this.executeWorkflow(workflowId);
    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      workflow.status = 'paused';
      emit('workflow.failed', { workflowId, workflow, error });
    }
  }

  // Execute workflow step
  private async executeWorkflowStep(step: WorkflowStep): Promise<void> {
    // Execute the step action
    // This would integrate with the appropriate service
    emit('workflow.step_executed', { step });
  }

  // Get workflow
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  // Get all workflows
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  // Pause workflow
  pauseWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'paused';
    }
  }

  // Resume workflow
  resumeWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow && workflow.status === 'paused') {
      workflow.status = 'active';
      this.executeWorkflow(workflowId);
    }
  }

  // Cancel workflow
  cancelWorkflow(workflowId: string): void {
    this.workflows.delete(workflowId);
  }

  // Get all rules
  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  // Start engine
  start(): void {
    this.running = true;
  }

  // Stop engine
  stop(): void {
    this.running = false;
  }
}

// Singleton instance
export const automationEngine = new AutomationEngine();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addRule(rule: Rule): void {
  automationEngine.addRule(rule);
}

export function removeRule(ruleId: string): void {
  automationEngine.removeRule(ruleId);
}

export function toggleRule(ruleId: string, enabled: boolean): void {
  automationEngine.toggleRule(ruleId, enabled);
}

export function createWorkflow(workflow: Omit<Workflow, 'status' | 'currentStep' | 'startTime'>): string {
  return automationEngine.createWorkflow(workflow);
}

export function getWorkflow(workflowId: string): Workflow | undefined {
  return automationEngine.getWorkflow(workflowId);
}

export function getAllWorkflows(): Workflow[] {
  return automationEngine.getAllWorkflows();
}

export function pauseWorkflow(workflowId: string): void {
  automationEngine.pauseWorkflow(workflowId);
}

export function resumeWorkflow(workflowId: string): void {
  automationEngine.resumeWorkflow(workflowId);
}

export function cancelWorkflow(workflowId: string): void {
  automationEngine.cancelWorkflow(workflowId);
}

export function getAllRules(): Rule[] {
  return automationEngine.getAllRules();
}
