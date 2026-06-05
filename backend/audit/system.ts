// ── Enterprise Audit System ───────────────────────────────────────────────────
// Before/after changes, affected resources, IPs, devices, geo locations, immutable trails

export interface AuditEvent {
  id: string;
  eventType: string;
  category: 'user' | 'device' | 'organization' | 'system' | 'security' | 'compliance';
  actor: {
    userId?: string;
    userType: 'user' | 'system' | 'api' | 'service';
    ipAddress: string;
    userAgent?: string;
    deviceId?: string;
    location?: {
      country?: string;
      city?: string;
      lat?: number;
      lng?: number;
    };
  };
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
    diff?: ChangeDiff[];
  };
  metadata: Record<string, any>;
  timestamp: Date;
  correlationId?: string;
  requestId?: string;
}

export interface ChangeDiff {
  path: string;
  kind: 'create' | 'update' | 'delete';
  oldValue?: any;
  newValue?: any;
}

export interface AuditTrail {
  id: string;
  resourceId: string;
  resourceType: string;
  events: AuditEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditQuery {
  eventType?: string;
  category?: AuditEvent['category'];
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  country?: string;
  limit?: number;
  offset?: number;
}

export interface AuditExport {
  id: string;
  query: AuditQuery;
  format: 'json' | 'csv' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

class EnterpriseAuditSystem {
  private events: AuditEvent[] = [];
  private trails: Map<string, AuditTrail> = new Map();
  private exports: Map<string, AuditExport> = new Map();

  // Record audit event
  recordEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const auditEvent: AuditEvent = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    // Calculate diff if before and after are provided
    if (event.changes.before && event.changes.after) {
      auditEvent.changes.diff = this.calculateDiff(event.changes.before, event.changes.after);
    }

    this.events.push(auditEvent);

    // Update audit trail
    this.updateTrail(auditEvent);

    return auditEvent;
  }

  // Calculate diff between before and after
  private calculateDiff(before: Record<string, any>, after: Record<string, any>): ChangeDiff[] {
    const diff: ChangeDiff[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const oldValue = before[key];
      const newValue = after[key];

      if (oldValue === undefined && newValue !== undefined) {
        diff.push({ path: key, kind: 'create', newValue });
      } else if (oldValue !== undefined && newValue === undefined) {
        diff.push({ path: key, kind: 'delete', oldValue });
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff.push({ path: key, kind: 'update', oldValue, newValue });
      }
    }

    return diff;
  }

  // Update audit trail
  private updateTrail(event: AuditEvent): void {
    const trailKey = `${event.resource.type}_${event.resource.id}`;
    let trail = this.trails.get(trailKey);

    if (!trail) {
      trail = {
        id: `trail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resourceId: event.resource.id,
        resourceType: event.resource.type,
        events: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.trails.set(trailKey, trail);
    }

    trail.events.push(event);
    trail.updatedAt = new Date();

    // Keep only last 1000 events per trail
    if (trail.events.length > 1000) {
      trail.events = trail.events.slice(-1000);
    }
  }

  // Query audit events
  queryEvents(query: AuditQuery): AuditEvent[] {
    let results = [...this.events];

    if (query.eventType) {
      results = results.filter(e => e.eventType === query.eventType);
    }

    if (query.category) {
      results = results.filter(e => e.category === query.category);
    }

    if (query.userId) {
      results = results.filter(e => e.actor.userId === query.userId);
    }

    if (query.resourceType) {
      results = results.filter(e => e.resource.type === query.resourceType);
    }

    if (query.resourceId) {
      results = results.filter(e => e.resource.id === query.resourceId);
    }

    if (query.startDate) {
      results = results.filter(e => e.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter(e => e.timestamp <= query.endDate!);
    }

    if (query.ipAddress) {
      results = results.filter(e => e.actor.ipAddress === query.ipAddress);
    }

    if (query.country) {
      results = results.filter(e => e.actor.location?.country === query.country);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (query.offset) {
      results = results.slice(query.offset);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  // Get audit trail for resource
  getTrail(resourceType: string, resourceId: string): AuditTrail | undefined {
    return this.trails.get(`${resourceType}_${resourceId}`);
  }

  // Get all trails
  getAllTrails(): AuditTrail[] {
    return Array.from(this.trails.values());
  }

  // Get user activity
  getUserActivity(userId: string, limit = 100): AuditEvent[] {
    return this.queryEvents({ userId, limit });
  }

  // Get device activity
  getDeviceActivity(deviceId: string, limit = 100): AuditEvent[] {
    return this.queryEvents({ resourceId: deviceId, limit });
  }

  // Get organization activity
  getOrganizationActivity(organizationId: string, limit = 100): AuditEvent[] {
    return this.queryEvents({ resourceId: organizationId, resourceType: 'organization', limit });
  }

  // Get security events
  getSecurityEvents(limit = 100): AuditEvent[] {
    return this.queryEvents({ category: 'security', limit });
  }

  // Get compliance events
  getComplianceEvents(limit = 100): AuditEvent[] {
    return this.queryEvents({ category: 'compliance', limit });
  }

  // Create audit export
  createExport(query: AuditQuery, format: AuditExport['format']): AuditExport {
    const auditExport: AuditExport = {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      format,
      status: 'pending',
      createdAt: new Date(),
    };

    this.exports.set(auditExport.id, auditExport);
    return auditExport;
  }

  // Process export
  async processExport(exportId: string): Promise<AuditExport> {
    const auditExport = this.exports.get(exportId);
    if (!auditExport) {
      throw new Error('Export not found');
    }

    auditExport.status = 'processing';

    try {
      const events = this.queryEvents(auditExport.query);
      let fileUrl: string;

      switch (auditExport.format) {
        case 'json':
          fileUrl = await this.exportJSON(events);
          break;
        case 'csv':
          fileUrl = await this.exportCSV(events);
          break;
        case 'pdf':
          fileUrl = await this.exportPDF(events);
          break;
        default:
          throw new Error('Unsupported format');
      }

      auditExport.status = 'completed';
      auditExport.fileUrl = fileUrl;
      auditExport.completedAt = new Date();
    } catch (error) {
      auditExport.status = 'failed';
      auditExport.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return auditExport;
  }

  // Export JSON
  private async exportJSON(events: AuditEvent[]): Promise<string> {
    const json = JSON.stringify(events, null, 2);
    const url = `https://storage.example.com/audit/${Date.now()}.json`;
    // In production, upload to storage
    return url;
  }

  // Export CSV
  private async exportCSV(events: AuditEvent[]): Promise<string> {
    if (events.length === 0) return '';

    const headers = ['id', 'eventType', 'category', 'userId', 'resourceType', 'resourceId', 'timestamp'];
    const rows = events.map(e => [
      e.id,
      e.eventType,
      e.category,
      e.actor.userId || '',
      e.resource.type,
      e.resource.id,
      e.timestamp.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const url = `https://storage.example.com/audit/${Date.now()}.csv`;
    // In production, upload to storage
    return url;
  }

  // Export PDF
  private async exportPDF(events: AuditEvent[]): Promise<string> {
    // In production, use PDF generation library
    const url = `https://storage.example.com/audit/${Date.now()}.pdf`;
    return url;
  }

  // Get export
  getExport(exportId: string): AuditExport | undefined {
    return this.exports.get(exportId);
  }

  // Get statistics
  getStatistics(): {
    totalEvents: number;
    byCategory: Record<string, number>;
    byEventType: Record<string, number>;
    byUserType: Record<string, number>;
    byCountry: Record<string, number>;
    totalTrails: number;
    totalExports: number;
    completedExports: number;
  } {
    const byCategory: Record<string, number> = {};
    const byEventType: Record<string, number> = {};
    const byUserType: Record<string, number> = {};
    const byCountry: Record<string, number> = {};

    for (const event of this.events) {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
      byUserType[event.actor.userType] = (byUserType[event.actor.userType] || 0) + 1;
      if (event.actor.location?.country) {
        byCountry[event.actor.location.country] = (byCountry[event.actor.location.country] || 0) + 1;
      }
    }

    return {
      totalEvents: this.events.length,
      byCategory,
      byEventType,
      byUserType,
      byCountry,
      totalTrails: this.trails.size,
      totalExports: this.exports.size,
      completedExports: Array.from(this.exports.values()).filter(e => e.status === 'completed').length,
    };
  }

  // Get event by ID
  getEvent(eventId: string): AuditEvent | undefined {
    return this.events.find(e => e.id === eventId);
  }

  // Search events by metadata
  searchByMetadata(key: string, value: any): AuditEvent[] {
    return this.events.filter(e => e.metadata[key] === value);
  }

  // Get events by correlation ID
  getEventsByCorrelationId(correlationId: string): AuditEvent[] {
    return this.events.filter(e => e.correlationId === correlationId);
  }

  // Get events by request ID
  getEventsByRequestId(requestId: string): AuditEvent[] {
    return this.events.filter(e => e.requestId === requestId);
  }

  // Initialize with sample events
  initializeSampleEvents(): void {
    this.recordEvent({
      eventType: 'user.login',
      category: 'user',
      actor: {
        userId: 'user_123',
        userType: 'user',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        location: { country: 'KE', city: 'Nairobi', lat: -1.2921, lng: 36.8219 },
      },
      resource: { type: 'user', id: 'user_123', name: 'John Doe' },
      changes: {},
      metadata: { method: 'password' },
    });

    this.recordEvent({
      eventType: 'device.created',
      category: 'device',
      actor: {
        userId: 'user_123',
        userType: 'user',
        ipAddress: '192.168.1.100',
        location: { country: 'KE', city: 'Nairobi' },
      },
      resource: { type: 'device', id: 'device_456', name: 'Samsung Galaxy S21' },
      changes: {
        before: {},
        after: { imei: '123456789012345', model: 'Samsung Galaxy S21' },
      },
      metadata: {},
    });

    this.recordEvent({
      eventType: 'device.updated',
      category: 'device',
      actor: {
        userId: 'user_123',
        userType: 'user',
        ipAddress: '192.168.1.100',
      },
      resource: { type: 'device', id: 'device_456', name: 'Samsung Galaxy S21' },
      changes: {
        before: { status: 'active' },
        after: { status: 'stolen' },
      },
      metadata: { reason: 'user_reported' },
    });
  }
}

// Singleton instance
export const enterpriseAuditSystem = new EnterpriseAuditSystem();

// Initialize sample events
enterpriseAuditSystem.initializeSampleEvents();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function recordAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  return enterpriseAuditSystem.recordEvent(event);
}

export function queryAuditEvents(query: AuditQuery): AuditEvent[] {
  return enterpriseAuditSystem.queryEvents(query);
}

export function getAuditTrail(resourceType: string, resourceId: string): AuditTrail | undefined {
  return enterpriseAuditSystem.getTrail(resourceType, resourceId);
}

export function getUserActivity(userId: string, limit?: number): AuditEvent[] {
  return enterpriseAuditSystem.getUserActivity(userId, limit);
}

export function getSecurityEvents(limit?: number): AuditEvent[] {
  return enterpriseAuditSystem.getSecurityEvents(limit);
}

export function createAuditExport(query: AuditQuery, format: AuditExport['format']): AuditExport {
  return enterpriseAuditSystem.createExport(query, format);
}

export async function processAuditExport(exportId: string): Promise<AuditExport> {
  return enterpriseAuditSystem.processExport(exportId);
}

export function getAuditStatistics() {
  return enterpriseAuditSystem.getStatistics();
}
