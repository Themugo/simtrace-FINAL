// services/infrastructure/globalLawEnforcement.ts - Global law enforcement network integration
import crypto from 'crypto';

export interface LawEnforcementAgency {
  agencyId: string;
  name: string;
  countryCode: string;
  type: 'police' | 'fbi' | 'interpol' | 'customs' | 'private';
  jurisdiction: string[];
  contactEmail: string;
  contactPhone: string;
  apiEndpoint?: string;
  isActive: boolean;
  responseTime: number; // Average response time in hours
  successRate: number; // Percentage of successful recoveries
}

export interface EnforcementRequest {
  requestId: string;
  deviceId: string;
  imei: string;
  requestingAgency: string;
  requestType: 'location' | 'recovery' | 'investigation' | 'block';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  timestamp: number;
  expiresAt: number;
  evidence: string[];
  caseNumber?: string;
  assignedOfficer?: string;
  notes?: string;
}

export interface EnforcementResponse {
  responseId: string;
  requestId: string;
  respondingAgency: string;
  responseType: 'location_found' | 'device_recovered' | 'investigation_complete' | 'blocked' | 'unable_to_locate';
  data: any;
  timestamp: number;
  verified: boolean;
}

export class GlobalLawEnforcementService {
  private agencies: Map<string, LawEnforcementAgency> = new Map();
  private requests: Map<string, EnforcementRequest> = new Map();
  private responses: Map<string, EnforcementResponse> = new Map();
  private partnerships: Map<string, string[]> = new Map(); // agencyId -> partner agency IDs

  constructor() {
    this.initializeAgencies();
  }

  /**
   * Initialize law enforcement agencies
   */
  private initializeAgencies(): void {
    const agencies: LawEnforcementAgency[] = [
      {
        agencyId: 'interpol',
        name: 'INTERPOL',
        countryCode: 'FR',
        type: 'interpol',
        jurisdiction: ['global'],
        contactEmail: 'contact@interpol.int',
        contactPhone: '+33 4 72 44 71 71',
        apiEndpoint: 'https://api.interpol.int',
        isActive: true,
        responseTime: 48,
        successRate: 85
      },
      {
        agencyId: 'fbi',
        name: 'Federal Bureau of Investigation',
        countryCode: 'US',
        type: 'fbi',
        jurisdiction: ['US'],
        contactEmail: 'tips@fbi.gov',
        contactPhone: '+1 800 225 5324',
        apiEndpoint: 'https://api.fbi.gov',
        isActive: true,
        responseTime: 24,
        successRate: 90
      },
      {
        agencyId: 'scotland_yard',
        name: 'Metropolitan Police Service',
        countryCode: 'UK',
        type: 'police',
        jurisdiction: ['UK'],
        contactEmail: 'contact@met.police.uk',
        contactPhone: '+44 20 7230 1212',
        isActive: true,
        responseTime: 12,
        successRate: 88
      },
      {
        agencyId: 'kenya_police',
        name: 'Kenya Police Service',
        countryCode: 'KE',
        type: 'police',
        jurisdiction: ['KE'],
        contactEmail: 'info@ke.nps.go.ke',
        contactPhone: '+254 20 272 1111',
        isActive: true,
        responseTime: 6,
        successRate: 75
      },
      {
        agencyId: 'nigeria_police',
        name: 'Nigeria Police Force',
        countryCode: 'NG',
        type: 'police',
        jurisdiction: ['NG'],
        contactEmail: 'info@npf.gov.ng',
        contactPhone: '+234 9 290 2900',
        isActive: true,
        responseTime: 8,
        successRate: 70
      },
      {
        agencyId: 'south_africa_police',
        name: 'South African Police Service',
        countryCode: 'ZA',
        type: 'police',
        jurisdiction: ['ZA'],
        contactEmail: 'info@saps.gov.za',
        contactPhone: '+27 12 393 3700',
        isActive: true,
        responseTime: 10,
        successRate: 72
      }
    ];

    for (const agency of agencies) {
      this.agencies.set(agency.agencyId, agency);
    }

    // Initialize partnerships
    this.partnerships.set('interpol', ['fbi', 'scotland_yard', 'kenya_police', 'nigeria_police', 'south_africa_police']);
    this.partnerships.set('fbi', ['interpol', 'scotland_yard']);
    this.partnerships.set('scotland_yard', ['interpol', 'fbi']);
  }

  /**
   * Register new agency
   */
  registerAgency(agency: Omit<LawEnforcementAgency, 'agencyId'>): LawEnforcementAgency {
    const agencyId = crypto.randomBytes(16).toString('hex');
    
    const newAgency: LawEnforcementAgency = {
      ...agency,
      agencyId
    };

    this.agencies.set(agencyId, newAgency);
    return newAgency;
  }

  /**
   * Submit enforcement request
   */
  submitRequest(
    deviceId: string,
    imei: string,
    requestingAgency: string,
    requestType: 'location' | 'recovery' | 'investigation' | 'block',
    priority: 'low' | 'normal' | 'high' | 'urgent',
    evidence: string[],
    ttl: number = 2592000000 // 30 days default
  ): EnforcementRequest {
    const requestId = crypto.randomBytes(16).toString('hex');

    const request: EnforcementRequest = {
      requestId,
      deviceId,
      imei,
      requestingAgency,
      requestType,
      priority,
      status: 'pending',
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      evidence
    };

    this.requests.set(requestId, request);

    // Auto-approve for urgent requests
    if (priority === 'urgent') {
      this.approveRequest(requestId, requestingAgency);
    }

    return request;
  }

  /**
   * Approve enforcement request
   */
  approveRequest(requestId: string, approvingAgency: string): boolean {
    const request = this.requests.get(requestId);
    
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'approved';
    request.assignedOfficer = 'System Auto-Approval';
    this.requests.set(requestId, request);

    // Notify partner agencies
    this.notifyPartnerAgencies(request, approvingAgency);

    return true;
  }

  /**
   * Reject enforcement request
   */
  rejectRequest(requestId: string, _rejectingAgency: string, reason?: string): boolean {
    const request = this.requests.get(requestId);
    
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'rejected';
    request.notes = reason;
    this.requests.set(requestId, request);

    return true;
  }

  /**
   * Cancel enforcement request
   */
  cancelRequest(requestId: string): boolean {
    const request = this.requests.get(requestId);
    
    if (!request || ['completed', 'cancelled'].includes(request.status)) {
      return false;
    }

    request.status = 'cancelled';
    this.requests.set(requestId, request);

    return true;
  }

  /**
   * Notify partner agencies
   */
  private notifyPartnerAgencies(request: EnforcementRequest, notifyingAgency: string): void {
    const partners = this.partnerships.get(notifyingAgency) || [];

    for (const partnerId of partners) {
      const partner = this.agencies.get(partnerId);
      
      if (partner && partner.isActive) {
        // In production, this would send actual notifications
        console.log(`Notifying ${partner.name} about request ${request.requestId}`);
      }
    }
  }

  /**
   * Submit enforcement response
   */
  submitResponse(
    requestId: string,
    respondingAgency: string,
    responseType: 'location_found' | 'device_recovered' | 'investigation_complete' | 'blocked' | 'unable_to_locate',
    data: any
  ): EnforcementResponse {
    const responseId = crypto.randomBytes(16).toString('hex');

    const response: EnforcementResponse = {
      responseId,
      requestId,
      respondingAgency,
      responseType,
      data,
      timestamp: Date.now(),
      verified: false
    };

    this.responses.set(responseId, response);

    // Update request status
    const request = this.requests.get(requestId);
    if (request) {
      if (responseType === 'device_recovered' || responseType === 'blocked') {
        request.status = 'completed';
      } else {
        request.status = 'in_progress';
      }
      this.requests.set(requestId, request);
    }

    return response;
  }

  /**
   * Get request status
   */
  getRequestStatus(requestId: string): EnforcementRequest | null {
    return this.requests.get(requestId) || null;
  }

  /**
   * Get requests by device
   */
  getRequestsByDevice(deviceId: string): EnforcementRequest[] {
    return Array.from(this.requests.values())
      .filter(req => req.deviceId === deviceId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get requests by agency
   */
  getRequestsByAgency(agencyId: string): EnforcementRequest[] {
    return Array.from(this.requests.values())
      .filter(req => req.requestingAgency === agencyId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get responses for request
   */
  getResponsesForRequest(requestId: string): EnforcementResponse[] {
    return Array.from(this.responses.values())
      .filter(resp => resp.requestId === requestId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all agencies
   */
  getAllAgencies(): LawEnforcementAgency[] {
    return Array.from(this.agencies.values());
  }

  /**
   * Get active agencies
   */
  getActiveAgencies(): LawEnforcementAgency[] {
    return Array.from(this.agencies.values()).filter(a => a.isActive);
  }

  /**
   * Get agencies by country
   */
  getAgenciesByCountry(countryCode: string): LawEnforcementAgency[] {
    return Array.from(this.agencies.values())
      .filter(a => a.countryCode === countryCode);
  }

  /**
   * Get agency by ID
   */
  getAgency(agencyId: string): LawEnforcementAgency | null {
    return this.agencies.get(agencyId) || null;
  }

  /**
   * Add partnership between agencies
   */
  addPartnership(agencyId1: string, agencyId2: string): boolean {
    const agency1 = this.agencies.get(agencyId1);
    const agency2 = this.agencies.get(agencyId2);

    if (!agency1 || !agency2) {
      return false;
    }

    const partners1 = this.partnerships.get(agencyId1) || [];
    const partners2 = this.partnerships.get(agencyId2) || [];

    if (!partners1.includes(agencyId2)) {
      partners1.push(agencyId2);
      this.partnerships.set(agencyId1, partners1);
    }

    if (!partners2.includes(agencyId1)) {
      partners2.push(agencyId1);
      this.partnerships.set(agencyId2, partners2);
    }

    return true;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalAgencies: number;
    activeAgencies: number;
    totalRequests: number;
    requestsByStatus: { [key: string]: number };
    requestsByType: { [key: string]: number };
    totalResponses: number;
    averageResponseTime: number;
    successRate: number;
  } {
    const agencies = Array.from(this.agencies.values());
    const requests = Array.from(this.requests.values());
    const responses = Array.from(this.responses.values());

    const requestsByStatus: { [key: string]: number } = {};
    const requestsByType: { [key: string]: number } = {};

    for (const request of requests) {
      requestsByStatus[request.status] = (requestsByStatus[request.status] || 0) + 1;
      requestsByType[request.requestType] = (requestsByType[request.requestType] || 0) + 1;
    }

    const completedRequests = requests.filter(r => r.status === 'completed');
    const successRate = completedRequests.length > 0 
      ? (completedRequests.length / requests.length) * 100 
      : 0;

    const averageResponseTime = agencies.length > 0
      ? agencies.reduce((sum, a) => sum + a.responseTime, 0) / agencies.length
      : 0;

    return {
      totalAgencies: agencies.length,
      activeAgencies: agencies.filter(a => a.isActive).length,
      totalRequests: requests.length,
      requestsByStatus,
      requestsByType,
      totalResponses: responses.length,
      averageResponseTime,
      successRate
    };
  }

  /**
   * Activate agency
   */
  activateAgency(agencyId: string): boolean {
    const agency = this.agencies.get(agencyId);
    
    if (agency) {
      agency.isActive = true;
      this.agencies.set(agencyId, agency);
      return true;
    }

    return false;
  }

  /**
   * Deactivate agency
   */
  deactivateAgency(agencyId: string): boolean {
    const agency = this.agencies.get(agencyId);
    
    if (agency) {
      agency.isActive = false;
      this.agencies.set(agencyId, agency);
      return true;
    }

    return false;
  }

  /**
   * Clear expired requests
   */
  clearExpiredRequests(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [requestId, request] of this.requests.entries()) {
      if (now > request.expiresAt && request.status === 'pending') {
        request.status = 'cancelled';
        request.notes = 'Request expired';
        this.requests.set(requestId, request);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export requests
   */
  exportRequests(agencyId?: string): string {
    const requests = agencyId
      ? Array.from(this.requests.values()).filter(r => r.requestingAgency === agencyId)
      : Array.from(this.requests.values());
    
    return JSON.stringify(requests, null, 2);
  }

  /**
   * Import requests
   */
  importRequests(requests: EnforcementRequest[]): number {
    let imported = 0;

    for (const request of requests) {
      if (!this.requests.has(request.requestId)) {
        this.requests.set(request.requestId, request);
        imported++;
      }
    }

    return imported;
  }
}

export const globalLawEnforcementService = new GlobalLawEnforcementService();
