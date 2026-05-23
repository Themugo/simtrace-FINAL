# Advanced Automation Engine

Rule engine for automation workflows, escalation chains, and recovery workflows.

## Features

- **Rule Engine**: Condition-based rule evaluation with priority support
- **Automation Workflows**: Multi-step workflows for complex automation
- **Escalation Chains**: Automatic escalation with configurable levels and intervals
- **Recovery Workflows**: Automated recovery processes based on device digital twin
- **Alert Workflows**: Multi-channel alert notifications
- **Predefined Workflows**: SIM swap investigation, high-risk device handling

## Usage

### Add Custom Rule

```typescript
import { addRule } from './modules/automation/index.js';

addRule({
  id: 'rule_custom',
  name: 'Custom Rule',
  enabled: true,
  priority: 5,
  conditions: [
    { type: 'risk_threshold', operator: 'gt', value: 70 },
  ],
  actions: [
    { type: 'notify', params: { recipients: ['admin'], message: 'Risk threshold exceeded' } },
  ],
});
```

### Create Escalation Chain

```typescript
import { createEscalationChain } from './modules/automation/index.js';

const workflowId = createEscalationChain({
  imei: '123456789012345',
  initialLevel: 1,
  maxLevel: 5,
  intervalMinutes: 30,
});
```

### Create Recovery Workflow

```typescript
import { createRecoveryWorkflow } from './modules/automation/index.js';

const workflowId = createRecoveryWorkflow({
  imei: '123456789012345',
  recoveryLikelihood: 0.85,
  knownLocations: [
    { lat: -1.2921, lng: 36.8219 },
    { lat: -1.2856, lng: 36.8282 },
  ],
});
```

### Create Alert Workflow

```typescript
import { createAlertWorkflow } from './modules/automation/index.js';

const workflowId = createAlertWorkflow({
  imei: '123456789012345',
  alertType: 'theft_detected',
  severity: 'critical',
  recipients: ['security_team', 'management'],
});
```

### Create SIM Swap Investigation Workflow

```typescript
import { createSIMSwapInvestigationWorkflow } from './modules/automation/index.js';

const workflowId = createSIMSwapInvestigationWorkflow(
  '123456789012345',
  '89912345678901234567',
  '89998765432109876543'
);
```

### Create High Risk Device Workflow

```typescript
import { createHighRiskDeviceWorkflow } from './modules/automation/index.js';

const workflowId = createHighRiskDeviceWorkflow(
  '123456789012345',
  95,
  'CRITICAL'
);
```

### Manage Workflows

```typescript
import { getWorkflow, pauseWorkflow, resumeWorkflow, cancelWorkflow } from './modules/automation/index.js';

// Get workflow status
const workflow = getWorkflow(workflowId);
console.log('Workflow status:', workflow?.status);

// Pause workflow
pauseWorkflow(workflowId);

// Resume workflow
resumeWorkflow(workflowId);

// Cancel workflow
cancelWorkflow(workflowId);
```

### Manage Rules

```typescript
import { getAllRules, toggleRule, removeRule } from './modules/automation/index.js';

// Get all rules
const rules = getAllRules();
console.log('Rules:', rules);

// Toggle rule
toggleRule('rule_sim_high_risk', false);

// Remove rule
removeRule('rule_custom');
```

## Rule Conditions

```typescript
interface RuleCondition {
  type: 'risk_threshold' | 'sim_change' | 'location_change' | 'time_window' | 'custom';
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
  field?: string;
}
```

### Condition Types

- **risk_threshold**: Compare risk score
- **sim_change**: Detect SIM card changes
- **location_change**: Detect location changes
- **time_window**: Time-based conditions
- **custom**: Custom condition matching

### Operators

- **eq**: Equal to
- **gt**: Greater than
- **lt**: Less than
- **gte**: Greater than or equal to
- **lte**: Less than or equal to
- **in**: Value in array
- **contains**: String contains

## Rule Actions

```typescript
interface RuleAction {
  type: 'notify' | 'alert' | 'freeze_device' | 'create_case' | 'escalate' | 'custom';
  params: Record<string, any>;
}
```

### Action Types

- **notify**: Send notification to recipients
- **alert**: Send alert with severity
- **freeze_device**: Freeze device
- **create_case**: Create investigation case
- **escalate**: Escalate to higher level
- **custom**: Execute custom action

## Default Rules

The automation engine includes default rules:

1. **SIM Change with High Risk**: SIM change AND risk > 80 → notify investigator + freeze device
2. **Critical Risk Alert**: Risk >= 90 → create case + escalate
3. **Impossible Travel Detection**: Impossible travel → alert + create case

## Workflow Steps

```typescript
interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
}
```

## Event Integration

The automation engine listens to events:

- `risk.calculated` - Evaluates risk threshold rules
- `sim.changed` - Evaluates SIM change rules
- `risk.high` - Evaluates high risk rules

The automation engine emits events:

- `automation.notify` - Notification action
- `automation.alert` - Alert action
- `automation.freeze_device` - Device freeze action
- `automation.create_case` - Case creation action
- `automation.escalate` - Escalation action
- `automation.custom` - Custom action
- `workflow.completed` - Workflow completed
- `workflow.failed` - Workflow failed
- `workflow.step_executed` - Workflow step executed

## Best Practices

1. **Rule Priority**: Use priority to control rule execution order
2. **Rule Conditions**: Keep conditions simple and specific
3. **Workflow Steps**: Break complex workflows into small steps
4. **Error Handling**: Handle workflow step failures gracefully
5. **Event Integration**: Use events to trigger automation
6. **Monitoring**: Monitor workflow execution and rule matches

## Performance Considerations

1. **Rule Evaluation**: Rules are evaluated in priority order
2. **Workflow Execution**: Steps execute sequentially
3. **Event Throttling**: Consider throttling high-frequency events
4. **Database Queries**: Cache data used in rule conditions
5. **Async Actions**: Execute actions asynchronously to avoid blocking

## Future Enhancements

- Add visual rule builder
- Implement workflow templates
- Add rule versioning
- Implement rule testing and validation
- Add workflow scheduling
- Implement rule analytics and reporting
