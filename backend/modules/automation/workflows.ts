// ── Predefined Automation Workflows ─────────────────────────────────────────────────
// Common automation workflows for escalation, recovery, and alerts

import { createWorkflow, WorkflowStep } from './engine.js';

export interface EscalationChainConfig {
  imei: string;
  initialLevel: number;
  maxLevel: number;
  intervalMinutes: number;
}

export interface RecoveryWorkflowConfig {
  imei: string;
  recoveryLikelihood: number;
  knownLocations: Array<{ lat: number; lng: number }>;
}

export interface AlertWorkflowConfig {
  imei: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
}

// ── Escalation Chain Workflow ─────────────────────────────────────────────────────
export function createEscalationChain(config: EscalationChainConfig): string {
  const steps: WorkflowStep[] = [];

  for (let level = config.initialLevel; level <= config.maxLevel; level++) {
    steps.push({
      id: `escalation_step_${level}`,
      name: `Escalation Level ${level}`,
      action: 'escalate',
      params: {
        imei: config.imei,
        level,
        delay: config.intervalMinutes * 60 * 1000, // Convert to milliseconds
      },
      status: 'pending' as const,
    });
  }

  return createWorkflow({
    id: '',
    name: `Escalation Chain for ${config.imei}`,
    type: 'escalation',
    steps,
  });
}

// ── Recovery Workflow ─────────────────────────────────────────────────────────────
export function createRecoveryWorkflow(config: RecoveryWorkflowConfig): string {
  const steps: WorkflowStep[] = [
    {
      id: 'recovery_step_1',
      name: 'Notify Recovery Team',
      action: 'notify',
      params: {
        recipients: ['recovery_team'],
        message: `High recovery likelihood (${(config.recoveryLikelihood * 100).toFixed(0)}%) for device ${config.imei}`,
      },
      status: 'pending' as const,
    },
    {
      id: 'recovery_step_2',
      name: 'Generate Recovery Plan',
      action: 'custom',
      params: {
        action: 'generate_recovery_plan',
        imei: config.imei,
        knownLocations: config.knownLocations,
      },
      status: 'pending' as const,
    },
    {
      id: 'recovery_step_3',
      name: 'Deploy Recovery Resources',
      action: 'custom',
      params: {
        action: 'deploy_resources',
        imei: config.imei,
        locations: config.knownLocations,
      },
      status: 'pending' as const,
    },
  ];

  return createWorkflow({
    id: '',
    name: `Recovery Workflow for ${config.imei}`,
    type: 'recovery',
    steps,
  });
}

// ── Alert Workflow ─────────────────────────────────────────────────────────────────
export function createAlertWorkflow(config: AlertWorkflowConfig): string {
  const steps: WorkflowStep[] = [
    {
      id: 'alert_step_1',
      name: 'Send Alert Notification',
      action: 'notify',
      params: {
        recipients: config.recipients,
        message: `Alert: ${config.alertType} for device ${config.imei}`,
      },
      status: 'pending' as const,
    },
    {
      id: 'alert_step_2',
      name: 'Log Alert',
      action: 'custom',
      params: {
        action: 'log_alert',
        imei: config.imei,
        alertType: config.alertType,
        severity: config.severity,
      },
      status: 'pending' as const,
    },
  ];

  if (config.severity === 'critical') {
    steps.push({
      id: 'alert_step_3',
      name: 'Escalate to Management',
      action: 'escalate',
      params: {
        imei: config.imei,
        level: 'management',
      },
      status: 'pending' as const,
    });
  }

  return createWorkflow({
    id: '',
    name: `Alert Workflow for ${config.alertType}`,
    type: 'alert',
    steps,
  });
}

// ── SIM Swap Investigation Workflow ─────────────────────────────────────────────────
export function createSIMSwapInvestigationWorkflow(imei: string, oldSimIccid: string, newSimIccid: string): string {
  const steps: WorkflowStep[] = [
    {
      id: 'sim_swap_step_1',
      name: 'Log SIM Swap Event',
      action: 'custom',
      params: {
        action: 'log_sim_swap',
        imei,
        oldSimIccid,
        newSimIccid,
      },
      status: 'pending' as const,
    },
    {
      id: 'sim_swap_step_2',
      name: 'Notify Security Team',
      action: 'notify',
      params: {
        recipients: ['security_team'],
        message: `SIM swap detected for device ${imei}`,
      },
      status: 'pending' as const,
    },
    {
      id: 'sim_swap_step_3',
      name: 'Freeze Device',
      action: 'freeze_device',
      params: {
        imei,
        reason: 'SIM swap detected',
      },
      status: 'pending' as const,
    },
    {
      id: 'sim_swap_step_4',
      name: 'Create Investigation Case',
      action: 'create_case',
      params: {
        imei,
        priority: 'high',
        type: 'sim_swap',
      },
      status: 'pending' as const,
    },
  ];

  return createWorkflow({
    id: '',
    name: `SIM Swap Investigation for ${imei}`,
    type: 'custom',
    steps,
  });
}

// ── High Risk Device Workflow ───────────────────────────────────────────────────────
export function createHighRiskDeviceWorkflow(imei: string, riskScore: number, threatLevel: string): string {
  const steps: WorkflowStep[] = [
    {
      id: 'high_risk_step_1',
      name: 'Log High Risk Event',
      action: 'custom',
      params: {
        action: 'log_high_risk',
        imei,
        riskScore,
        threatLevel,
      },
      status: 'pending' as const,
    },
    {
      id: 'high_risk_step_2',
      name: 'Notify Risk Team',
      action: 'notify',
      params: {
        recipients: ['risk_team'],
        message: `High risk detected for device ${imei}: ${threatLevel} (${riskScore})`,
      },
      status: 'pending' as const,
    },
  ];

  if (threatLevel === 'CRITICAL') {
    steps.push({
      id: 'high_risk_step_3',
      name: 'Escalate Immediately',
      action: 'escalate',
      params: {
        imei,
        level: 'immediate',
      },
      status: 'pending' as const,
    });
  }

  return createWorkflow({
    id: '',
    name: `High Risk Device Workflow for ${imei}`,
    type: 'alert',
    steps,
  });
}
