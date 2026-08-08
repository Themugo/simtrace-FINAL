// ── Central Event Bus ───────────────────────────────────────────────────────────
// This provides a decoupled event system for the SimTrace platform
// Events enable loose coupling between modules and facilitate scaling

export type EventName = 
  | 'device.detected'
  | 'device.updated'
  | 'device.locked'
  | 'device.unlocked'
  | 'risk.calculated'
  | 'risk.high'
  | 'risk.changed'
  | 'user.login'
  | 'user.logout'
  | 'user.registered'
  | 'case.created'
  | 'case.updated'
  | 'case.resolved'
  | 'payment.completed'
  | 'payment.failed'
  | 'sim.changed'
  | 'location.detected'
  | 'alert.created'
  | 'organization.created'
  | 'organization.member_added'
  | 'webhook.triggered'
  | 'automation.notify'
  | 'automation.alert'
  | 'automation.freeze_device'
  | 'automation.create_case'
  | 'automation.escalate'
  | 'automation.custom'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'workflow.step_executed';

export interface Event {
  name: EventName;
  data: any;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  correlationId?: string;
}

export type EventHandler = (event: Event) => void | Promise<void>;

class EventBus {
  private handlers: Map<EventName, Set<EventHandler>> = new Map();
  private asyncHandlers: Map<EventName, Set<EventHandler>> = new Map();

  // Subscribe to an event
  on(eventName: EventName, handler: EventHandler, async = false): void {
    const handlersMap = async ? this.asyncHandlers : this.handlers;
    
    if (!handlersMap.has(eventName)) {
      handlersMap.set(eventName, new Set());
    }
    
    handlersMap.get(eventName)!.add(handler);
  }

  // Unsubscribe from an event
  off(eventName: EventName, handler: EventHandler): void {
    this.handlers.get(eventName)?.delete(handler);
    this.asyncHandlers.get(eventName)?.delete(handler);
  }

  // Emit an event (synchronous handlers)
  emit(eventName: EventName, data: any, metadata?: { userId?: string; organizationId?: string; correlationId?: string }): void {
    const event: Event = {
      name: eventName,
      data,
      timestamp: new Date(),
      ...metadata,
    };

    const handlers = this.handlers.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${eventName}:`, error);
        }
      }
    }

    // Emit to async handlers
    this.emitAsync(eventName, data, metadata);
  }

  // Emit an event (async handlers only)
  async emitAsync(eventName: EventName, data: any, metadata?: { userId?: string; organizationId?: string; correlationId?: string }): Promise<void> {
    const event: Event = {
      name: eventName,
      data,
      timestamp: new Date(),
      ...metadata,
    };

    const handlers = this.asyncHandlers.get(eventName);
    if (handlers) {
      const promises = Array.from(handlers).map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`[EventBus] Error in async handler for ${eventName}:`, error);
        }
      });
      
      await Promise.allSettled(promises);
    }
  }

  // Remove all handlers for an event
  removeAllListeners(eventName?: EventName): void {
    if (eventName) {
      this.handlers.delete(eventName);
      this.asyncHandlers.delete(eventName);
    } else {
      this.handlers.clear();
      this.asyncHandlers.clear();
    }
  }

  // Get handler count for an event
  listenerCount(eventName: EventName): number {
    const syncCount = this.handlers.get(eventName)?.size || 0;
    const asyncCount = this.asyncHandlers.get(eventName)?.size || 0;
    return syncCount + asyncCount;
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Convenience functions
export function on(eventName: EventName, handler: EventHandler, async = false): void {
  eventBus.on(eventName, handler, async);
}

export function off(eventName: EventName, handler: EventHandler): void {
  eventBus.off(eventName, handler);
}

export function emit(eventName: EventName, data: any, metadata?: { userId?: string; organizationId?: string; correlationId?: string }): void {
  eventBus.emit(eventName, data, metadata);
}

export async function emitAsync(eventName: EventName, data: any, metadata?: { userId?: string; organizationId?: string; correlationId?: string }): Promise<void> {
  await eventBus.emitAsync(eventName, data, metadata);
}
