export interface MobileDeviceRecord {
  id: string;
  userId: string;
  deviceId: string;
  platform: "IOS" | "ANDROID";
  model: string;
  osVersion: string;
  trusted: boolean;
  lastActive: string;
  createdAt: string;
}

export interface OfflineSyncItem {
  id: string;
  userId: string;
  action: "CREATE_NOTE" | "UPLOAD_EVIDENCE" | "UPDATE_CASE_STATUS" | "PING_LOCATION";
  payload: Record<string, any>;
  status: "PENDING" | "SYNCED" | "FAILED";
  retryCount: number;
  createdAt: string;
}

export interface MobileEvidenceCapture {
  id: string;
  caseId: string;
  capturedBy: string;
  mediaType: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";
  fileUrl: string;
  sha256Hash: string;
  gpsCoordinates: { latitude: number; longitude: number; accuracyMeters: number };
  deviceModel: string;
  capturedAt: string;
}

export interface FieldTeam {
  id: string;
  organizationId: string;
  name: string;
  leaderId: string;
  leaderName: string;
  membersCount: number;
  status: "ON_DUTY" | "STANDBY" | "OFF_DUTY";
  createdAt: string;
}

export interface RegionalSettings {
  country: string;
  countryCode: string;
  timezone: string;
  currency: string;
  language: string;
  complianceRules: string[];
}

const REGISTERED_DEVICES_STORE: MobileDeviceRecord[] = [
  {
    id: "dev-mob-01",
    userId: "user-inspect-doe",
    deviceId: "iPhone15Pro_KE_881",
    platform: "IOS",
    model: "iPhone 15 Pro",
    osVersion: "iOS 17.5.1",
    trusted: true,
    lastActive: "2026-08-01T02:25:00Z",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "dev-mob-02",
    userId: "user-sgt-smith",
    deviceId: "SamsungS24_KE_442",
    platform: "ANDROID",
    model: "Samsung Galaxy S24 Ultra",
    osVersion: "Android 14",
    trusted: true,
    lastActive: "2026-08-01T01:40:00Z",
    createdAt: "2026-03-01T00:00:00Z",
  },
];

const OFFLINE_SYNC_QUEUE_STORE: OfflineSyncItem[] = [
  {
    id: "sync-101",
    userId: "user-inspect-doe",
    action: "CREATE_NOTE",
    payload: { caseId: "case-ke-2026-0891", text: "Interviewed suspect at Westlands tower site." },
    status: "SYNCED",
    retryCount: 0,
    createdAt: "2026-08-01T01:10:00Z",
  },
  {
    id: "sync-102",
    userId: "user-inspect-doe",
    action: "UPLOAD_EVIDENCE",
    payload: { caseId: "case-ke-2026-0891", evidenceType: "SIM_CARD_PHOTO", hash: "a8f9c21..." },
    status: "PENDING",
    retryCount: 0,
    createdAt: "2026-08-01T02:20:00Z",
  },
];

const EVIDENCE_CAPTURES_STORE: MobileEvidenceCapture[] = [
  {
    id: "ev-mob-901",
    caseId: "case-ke-2026-0891",
    capturedBy: "Inspector Doe",
    mediaType: "PHOTO",
    fileUrl: "s3://simtrace-sovereign-evidence-prod/mobile/ev_901.jpg",
    sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    gpsCoordinates: { latitude: -1.286389, longitude: 36.817223, accuracyMeters: 3.5 },
    deviceModel: "iPhone 15 Pro",
    capturedAt: "2026-08-01T01:15:00Z",
  },
];

const FIELD_TEAMS_STORE: FieldTeam[] = [
  {
    id: "team-alpha",
    organizationId: "org-police-01",
    name: "Nairobi Tactical Fraud Response Team Alpha",
    leaderId: "user-inspect-doe",
    leaderName: "Inspector John Doe",
    membersCount: 6,
    status: "ON_DUTY",
    createdAt: "2026-01-20T00:00:00Z",
  },
  {
    id: "team-bravo",
    organizationId: "org-police-01",
    name: "Mombasa Telecom Intelligence Unit",
    leaderId: "user-sgt-smith",
    leaderName: "Sergeant Jane Smith",
    membersCount: 4,
    status: "STANDBY",
    createdAt: "2026-02-15T00:00:00Z",
  },
];

const REGIONAL_SETTINGS_STORE: RegionalSettings[] = [
  {
    country: "Kenya",
    countryCode: "KE",
    timezone: "Africa/Nairobi (UTC+3)",
    currency: "KES (KSh)",
    language: "English / Swahili",
    complianceRules: ["Data Protection Act 2019", "National Police Evidence Guidelines"],
  },
  {
    country: "United Kingdom",
    countryCode: "GB",
    timezone: "Europe/London (UTC+1)",
    currency: "GBP (£)",
    language: "English",
    complianceRules: ["UK GDPR", "Investigatory Powers Act 2016"],
  },
  {
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York (UTC-4)",
    currency: "USD ($)",
    language: "English",
    complianceRules: ["CJIS Security Policy", "HIPAA/SOC2 Type II"],
  },
];

export class MobileFieldService {
  public static getRegisteredDevices(userId?: string): MobileDeviceRecord[] {
    if (userId) {
      return REGISTERED_DEVICES_STORE.filter((d) => d.userId === userId);
    }
    return REGISTERED_DEVICES_STORE;
  }

  public static registerDevice(params: Omit<MobileDeviceRecord, "id" | "lastActive" | "createdAt">): MobileDeviceRecord {
    const record: MobileDeviceRecord = {
      ...params,
      id: `dev-mob-${Date.now()}`,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    REGISTERED_DEVICES_STORE.unshift(record);
    return record;
  }

  public static getSyncQueue(userId: string): OfflineSyncItem[] {
    return OFFLINE_SYNC_QUEUE_STORE.filter((s) => s.userId === userId);
  }

  public static queueOfflineAction(userId: string, action: OfflineSyncItem["action"], payload: Record<string, any>): OfflineSyncItem {
    const item: OfflineSyncItem = {
      id: `sync-${Date.now()}`,
      userId,
      action,
      payload,
      status: "PENDING",
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    OFFLINE_SYNC_QUEUE_STORE.push(item);
    return item;
  }

  public static processSyncQueue(userId: string): { processedCount: number; items: OfflineSyncItem[] } {
    const userItems = OFFLINE_SYNC_QUEUE_STORE.filter((s) => s.userId === userId && s.status === "PENDING");
    let processedCount = 0;
    for (const item of userItems) {
      item.status = "SYNCED";
      processedCount++;
    }
    return { processedCount, items: userItems };
  }

  public static captureMobileEvidence(params: Omit<MobileEvidenceCapture, "id" | "capturedAt">): MobileEvidenceCapture {
    const ev: MobileEvidenceCapture = {
      ...params,
      id: `ev-mob-${Date.now()}`,
      capturedAt: new Date().toISOString(),
    };
    EVIDENCE_CAPTURES_STORE.unshift(ev);
    return ev;
  }

  public static getEvidenceCaptures(caseId?: string): MobileEvidenceCapture[] {
    if (caseId) {
      return EVIDENCE_CAPTURES_STORE.filter((e) => e.caseId === caseId);
    }
    return EVIDENCE_CAPTURES_STORE;
  }

  public static getFieldTeams(orgId?: string): FieldTeam[] {
    if (orgId) {
      return FIELD_TEAMS_STORE.filter((t) => t.organizationId === orgId);
    }
    return FIELD_TEAMS_STORE;
  }

  public static getRegionalSettings(): RegionalSettings[] {
    return REGIONAL_SETTINGS_STORE;
  }
}
