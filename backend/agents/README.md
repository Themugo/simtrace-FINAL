# Real AI Agent System

Autonomous intelligence agents for recovery, fraud, telecom, and investigation.

## Features

- **Recovery Agent**: Predicts recovery paths, monitors device activity, triggers alerts
- **Fraud Agent**: Detects fraud rings, suspicious relationships, abnormal behavior
- **Telecom Agent**: Monitors blacklist activity, correlates carrier events, detects SIM swap patterns
- **Investigation Agent**: Summarizes cases, drafts reports, suggests leads
- **Agent Manager**: Centralized agent lifecycle management

## Usage

### Initialize Agents

```typescript
import { initializeDefaultAgents, startAllAgents } from './agents/index.js';

// Initialize default agents
initializeDefaultAgents();

// Start all agents
startAllAgents();
```

### Start Individual Agent

```typescript
import { startAgent, stopAgent } from './agents/index.js';

// Start specific agent
startAgent('recovery');
startAgent('fraud');
startAgent('telecom');
startAgent('investigation');

// Stop specific agent
stopAgent('recovery');
```

### Check Agent Status

```typescript
import { getAgentStatus } from './agents/index.js';

const status = getAgentStatus();
console.log('Agent status:', status);
// {
//   recovery: { running: true, config: { enabled: true, checkInterval: 60000 } },
//   fraud: { running: true, config: { enabled: true, checkInterval: 120000 } },
//   ...
// }
```

### Custom Agent Configuration

```typescript
import { AgentManager, Agent } from './agents/index.js';

class CustomAgent extends Agent {
  protected async run(): Promise<void> {
    // Custom agent logic
  }
}

const manager = new AgentManager();
manager.registerAgent('custom', new CustomAgent({ enabled: true, checkInterval: 30000 }));
manager.startAgent('custom');
```

## Agent Types

### Recovery Agent

- **Purpose**: Predict recovery paths and monitor device activity
- **Check Interval**: 60 seconds (default)
- **Actions**:
  - Gets high-risk devices
  - Predicts recovery paths using digital twin
  - Monitors device activity
  - Triggers alerts for high recovery likelihood

### Fraud Agent

- **Purpose**: Detect fraud and suspicious patterns
- **Check Interval**: 2 minutes (default)
- **Actions**:
  - Detects fraud rings using graph analysis
  - Finds suspicious relationships (short-lived device-SIM)
  - Detects abnormal behavior patterns

### Telecom Agent

- **Purpose**: Monitor telecom-related threats
- **Check Interval**: 5 minutes (default)
- **Actions**:
  - Monitors blacklist activity
  - Correlates events across carriers
  - Detects SIM swap patterns

### Investigation Agent

- **Purpose**: Assist with case investigation
- **Check Interval**: 3 minutes (default)
- **Actions**:
  - Summarizes open cases using AI
  - Drafts investigation reports
  - Suggests investigation leads

## Agent Events

Agents emit events that can be subscribed to:

```typescript
import { emit } from './events/index.js';

// Listen to agent events
emit.on('agent.recovery_opportunity', (data) => {
  console.log('Recovery opportunity:', data);
});

emit.on('agent.fraud_ring_detected', (data) => {
  console.log('Fraud ring detected:', data);
});

emit.on('agent.suspicious_relationship', (data) => {
  console.log('Suspicious relationship:', data);
});

emit.on('agent.case_update', (data) => {
  console.log('Case update:', data);
});
```

## Agent Configuration

```typescript
interface AgentConfig {
  enabled: boolean;
  checkInterval: number; // milliseconds
}
```

## Best Practices

1. **Start agents at application startup**: Initialize agents when the application starts
2. **Configure appropriate intervals**: Balance between responsiveness and resource usage
3. **Monitor agent events**: Subscribe to agent events for real-time updates
4. **Handle errors gracefully**: Agents should not crash the application
5. **Use agent events for notifications**: Integrate with notification system
6. **Scale horizontally**: Run agents on separate worker processes for large scale

## Performance Considerations

- Agents run on configurable intervals
- Each agent performs database queries
- Consider running agents on separate worker processes
- Use caching to reduce database load
- Monitor agent execution time

## Future Enhancements

- Add more specialized agents (e.g., Analytics Agent, Alert Agent)
- Implement agent priorities and resource allocation
- Add agent health monitoring and auto-restart
- Implement distributed agent coordination
- Add agent performance metrics
