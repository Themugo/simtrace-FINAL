// ── Compliance Foundation ───────────────────────────────────────────────────────
// GDPR, Kenya Data Protection Act, SOC2, ISO27001, consent tracking, data retention

export interface ConsentRecord {
  id: string;
  userId: string;
  type: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing';
  purpose: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  ipAddress: string;
  userAgent: string;
  documentVersion: string;
}

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: number; // in days
  retentionReason: string;
  legalBasis: string;
  deletionMethod: 'soft_delete' | 'hard_delete' | 'anonymize';
  complianceFramework: 'GDPR' | 'KDPA' | 'SOC2' | 'ISO27001' | 'all';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  processedBy?: string;
  notes?: string;
  dataExport?: string; // URL to exported data
}

export interface ComplianceAuditLog {
  id: string;
  eventType: 'consent_change' | 'data_access' | 'data_deletion' | 'policy_change' | 'dsr_request';
  userId?: string;
  resourceType: string;
  resourceId: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
  timestamp: Date;
  complianceFramework: string[];
}

export interface DataMappingRecord {
  id: string;
  dataField: string;
  dataType: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  purpose: string;
  legalBasis: string;
  retentionPolicyId: string;
  processingLocation: string;
  thirdPartySharing: boolean;
  thirdPartyDetails?: string;
}

class ComplianceFoundation {
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private retentionPolicies: Map<string, DataRetentionPolicy> = new Map();
  private dataSubjectRequests: Map<string, DataSubjectRequest> = new Map();
  private auditLogs: ComplianceAuditLog[] = [];
  private dataMapping: Map<string, DataMappingRecord> = new Map();

  // Record consent
  recordConsent(consent: Omit<ConsentRecord, 'id' | 'grantedAt'>): ConsentRecord {
    const consentRecord: ConsentRecord = {
      ...consent,
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      grantedAt: new Date(),
    };

    this.consentRecords.set(consentRecord.id, consentRecord);

    // Log consent change
    this.logAuditEvent({
      eventType: 'consent_change',
      userId: consent.userId,
      resourceType: 'consent',
      resourceId: consentRecord.id,
      action: consent.granted ? 'granted' : 'revoked',
      details: { type: consent.type, purpose: consent.purpose },
      ipAddress: consent.ipAddress,
      complianceFramework: ['GDPR', 'KDPA'],
    });

    return consentRecord;
  }

  // Revoke consent
  revokeConsent(consentId: string, ipAddress: string): ConsentRecord | null {
    const consent = this.consentRecords.get(consentId);
    if (!consent) return null;

    consent.granted = false;
    consent.revokedAt = new Date();

    this.logAuditEvent({
      eventType: 'consent_change',
      userId: consent.userId,
      resourceType: 'consent',
      resourceId: consentId,
      action: 'revoked',
      details: { type: consent.type },
      ipAddress,
      complianceFramework: ['GDPR', 'KDPA'],
    });

    return consent;
  }

  // Get user consents
  getUserConsents(userId: string): ConsentRecord[] {
    return Array.from(this.consentRecords.values()).filter(c => c.userId === userId);
  }

  // Check if user has consent
  hasConsent(userId: string, type: ConsentRecord['type']): boolean {
    const consents = this.getUserConsents(userId);
    const latestConsent = consents
      .filter(c => c.type === type)
      .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime())[0];

    return latestConsent?.granted && !latestConsent.revokedAt || false;
  }

  // Create retention policy
  createRetentionPolicy(policy: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): DataRetentionPolicy {
    const retentionPolicy: DataRetentionPolicy = {
      ...policy,
      id: `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.retentionPolicies.set(retentionPolicy.id, retentionPolicy);

    this.logAuditEvent({
      eventType: 'policy_change',
      resourceType: 'retention_policy',
      resourceId: retentionPolicy.id,
      action: 'created',
      details: { dataType: policy.dataType, retentionPeriod: policy.retentionPeriod },
      ipAddress: 'system',
      complianceFramework: [policy.complianceFramework],
    });

    return retentionPolicy;
  }

  // Update retention policy
  updateRetentionPolicy(policyId: string, updates: Partial<Omit<DataRetentionPolicy, 'id' | 'createdAt'>>): DataRetentionPolicy | null {
    const policy = this.retentionPolicies.get(policyId);
    if (!policy) return null;

    Object.assign(policy, updates);
    policy.updatedAt = new Date();

    this.logAuditEvent({
      eventType: 'policy_change',
      resourceType: 'retention_policy',
      resourceId: policyId,
      action: 'updated',
      details: updates,
      ipAddress: 'system',
      complianceFramework: [policy.complianceFramework],
    });

    return policy;
  }

  // Get retention policy
  getRetentionPolicy(policyId: string): DataRetentionPolicy | undefined {
    return this.retentionPolicies.get(policyId);
  }

  // Get retention policy by data type
  getRetentionPolicyByDataType(dataType: string): DataRetentionPolicy | undefined {
    return Array.from(this.retentionPolicies.values()).find(p => p.dataType === dataType && p.enabled);
  }

  // Get all retention policies
  getAllRetentionPolicies(): DataRetentionPolicy[] {
    return Array.from(this.retentionPolicies.values());
  }

  // Create data subject request
  createDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'requestedAt' | 'status'>): DataSubjectRequest {
    const dsr: DataSubjectRequest = {
      ...request,
      id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestedAt: new Date(),
      status: 'pending',
    };

    this.dataSubjectRequests.set(dsr.id, dsr);

    this.logAuditEvent({
      eventType: 'dsr_request',
      userId: request.userId,
      resourceType: 'data_subject_request',
      resourceId: dsr.id,
      action: 'created',
      details: { type: request.type },
      ipAddress: 'system',
      complianceFramework: ['GDPR', 'KDPA'],
    });

    return dsr;
  }

  // Update DSR status
  updateDSRStatus(requestId: string, status: DataSubjectRequest['status'], processedBy?: string, notes?: string, dataExport?: string): DataSubjectRequest | null {
    const dsr = this.dataSubjectRequests.get(requestId);
    if (!dsr) return null;

    dsr.status = status;
    if (status === 'completed') {
      dsr.completedAt = new Date();
    }
    if (processedBy) {
      dsr.processedBy = processedBy;
    }
    if (notes) {
      dsr.notes = notes;
    }
    if (dataExport) {
      dsr.dataExport = dataExport;
    }

    this.logAuditEvent({
      eventType: 'dsr_request',
      userId: dsr.userId,
      resourceType: 'data_subject_request',
      resourceId: requestId,
      action: `status_changed_to_${status}`,
      details: { processedBy, notes },
      ipAddress: 'system',
      complianceFramework: ['GDPR', 'KDPA'],
    });

    return dsr;
  }

  // Get DSR
  getDataSubjectRequest(requestId: string): DataSubjectRequest | undefined {
    return this.dataSubjectRequests.get(requestId);
  }

  // Get user DSRs
  getUserDataSubjectRequests(userId: string): DataSubjectRequest[] {
    return Array.from(this.dataSubjectRequests.values()).filter(d => d.userId === userId);
  }

  // Get pending DSRs
  getPendingDSRs(): DataSubjectRequest[] {
    return Array.from(this.dataSubjectRequests.values()).filter(d => d.status === 'pending');
  }

  // Log audit event
  private logAuditEvent(event: Omit<ComplianceAuditLog, 'id' | 'timestamp'>): void {
    const auditLog: ComplianceAuditLog = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.auditLogs.push(auditLog);
  }

  // Get audit logs
  getAuditLogs(filters?: {
    userId?: string;
    eventType?: ComplianceAuditLog['eventType'];
    complianceFramework?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): ComplianceAuditLog[] {
    let logs = [...this.auditLogs];

    if (filters?.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }

    if (filters?.eventType) {
      logs = logs.filter(l => l.eventType === filters.eventType);
    }

    if (filters?.complianceFramework) {
      logs = logs.filter(l => l.complianceFramework.includes(filters.complianceFramework!));
    }

    if (filters?.startDate) {
      logs = logs.filter(l => l.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      logs = logs.filter(l => l.timestamp <= filters.endDate!);
    }

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  // Add data mapping record
  addDataMappingRecord(mapping: Omit<DataMappingRecord, 'id'>): DataMappingRecord {
    const dataMapping: DataMappingRecord = {
      ...mapping,
      id: `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.dataMapping.set(dataMapping.id, dataMapping);
    return dataMapping;
  }

  // Get data mapping
  getDataMapping(mappingId: string): DataMappingRecord | undefined {
    return this.dataMapping.get(mappingId);
  }

  // Get all data mapping
  getAllDataMapping(): DataMappingRecord[] {
    return Array.from(this.dataMapping.values());
  }

  // Get data mapping by sensitivity
  getDataMappingBySensitivity(sensitivity: DataMappingRecord['sensitivity']): DataMappingRecord[] {
    return Array.from(this.dataMapping.values()).filter(m => m.sensitivity === sensitivity);
  }

  // Process data retention
  processDataRetention(): {
    deleted: number;
    anonymized: number;
    softDeleted: number;
  } {
    let deleted = 0;
    let anonymized = 0;
    let softDeleted = 0;

    for (const policy of this.retentionPolicies.values()) {
      if (!policy.enabled) continue;

      // In production, query database for data older than retention period
      // and apply deletion method

      this.logAuditEvent({
        eventType: 'data_deletion',
        resourceType: policy.dataType,
        resourceId: policy.id,
        action: 'retention_processed',
        details: { retentionPeriod: policy.retentionPeriod, deletionMethod: policy.deletionMethod },
        ipAddress: 'system',
        complianceFramework: [policy.complianceFramework],
      });
    }

    return { deleted, anonymized, softDeleted };
  }

  // Get statistics
  getStatistics(): {
    totalConsents: number;
    activeConsents: number;
    revokedConsents: number;
    totalRetentionPolicies: number;
    enabledRetentionPolicies: number;
    totalDSRs: number;
    pendingDSRs: number;
    completedDSRs: number;
    totalAuditLogs: number;
    totalDataMappings: number;
  } {
    const consents = Array.from(this.consentRecords.values());
    const activeConsents = consents.filter(c => c.granted && !c.revokedAt).length;
    const revokedConsents = consents.filter(c => !c.granted || c.revokedAt).length;

    const dsrs = Array.from(this.dataSubjectRequests.values());
    const pendingDSRs = dsrs.filter(d => d.status === 'pending').length;
    const completedDSRs = dsrs.filter(d => d.status === 'completed').length;

    return {
      totalConsents: this.consentRecords.size,
      activeConsents,
      revokedConsents,
      totalRetentionPolicies: this.retentionPolicies.size,
      enabledRetentionPolicies: Array.from(this.retentionPolicies.values()).filter(p => p.enabled).length,
      totalDSRs: this.dataSubjectRequests.size,
      pendingDSRs,
      completedDSRs,
      totalAuditLogs: this.auditLogs.length,
      totalDataMappings: this.dataMapping.size,
    };
  }

  // Initialize default configuration
  initializeDefaultConfiguration(): void {
    // Create retention policies
    this.createRetentionPolicy({
      dataType: 'device_telemetry',
      retentionPeriod: 365, // 1 year
      retentionReason: 'Operational needs and analytics',
      legalBasis: 'Legitimate interest',
      deletionMethod: 'anonymize',
      complianceFramework: 'GDPR',
      enabled: true,
    });

    this.createRetentionPolicy({
      dataType: 'user_activity_logs',
      retentionPeriod: 90, // 3 months
      retentionReason: 'Security and debugging',
      legalBasis: 'Legitimate interest',
      deletionMethod: 'hard_delete',
      complianceFramework: 'GDPR',
      enabled: true,
    });

    this.createRetentionPolicy({
      dataType: 'audit_logs',
      retentionPeriod: 2555, // 7 years
      retentionReason: 'Compliance requirements',
      legalBasis: 'Legal obligation',
      deletionMethod: 'hard_delete',
      complianceFramework: 'SOC2',
      enabled: true,
    });

    // Add data mapping
    this.addDataMappingRecord({
      dataField: 'imei',
      dataType: 'string',
      sensitivity: 'restricted',
      purpose: 'Device identification',
      legalBasis: 'Contractual necessity',
      retentionPolicyId: 'policy_1',
      processingLocation: 'Kenya',
      thirdPartySharing: false,
    });

    this.addDataMappingRecord({
      dataField: 'email',
      dataType: 'string',
      sensitivity: 'confidential',
      purpose: 'User communication',
      legalBasis: 'Consent',
      retentionPolicyId: 'policy_2',
      processingLocation: 'Kenya',
      thirdPartySharing: false,
    });
  }
}

// Singleton instance
export const complianceFoundation = new ComplianceFoundation();

// Initialize default configuration
complianceFoundation.initializeDefaultConfiguration();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function recordConsent(consent: Omit<ConsentRecord, 'id' | 'grantedAt'>): ConsentRecord {
  return complianceFoundation.recordConsent(consent);
}

export function revokeConsent(consentId: string, ipAddress: string): ConsentRecord | null {
  return complianceFoundation.revokeConsent(consentId, ipAddress);
}

export function hasConsent(userId: string, type: ConsentRecord['type']): boolean {
  return complianceFoundation.hasConsent(userId, type);
}

export function createRetentionPolicy(policy: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): DataRetentionPolicy {
  return complianceFoundation.createRetentionPolicy(policy);
}

export function createDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'requestedAt' | 'status'>): DataSubjectRequest {
  return complianceFoundation.createDataSubjectRequest(request);
}

export function updateDSRStatus(requestId: string, status: DataSubjectRequest['status'], processedBy?: string, notes?: string, dataExport?: string): DataSubjectRequest | null {
  return complianceFoundation.updateDSRStatus(requestId, status, processedBy, notes, dataExport);
}

export function getComplianceAuditLogs(filters?: {
  userId?: string;
  eventType?: ComplianceAuditLog['eventType'];
  complianceFramework?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): ComplianceAuditLog[] {
  return complianceFoundation.getAuditLogs(filters);
}

export function processDataRetention() {
  return complianceFoundation.processDataRetention();
}

export function getComplianceStatistics() {
  return complianceFoundation.getStatistics();
}
