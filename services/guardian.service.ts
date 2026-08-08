export interface SystemUser {
  systemUserId: string;
  nationalId: string;
  fullName: string;
  email: string;
  phone: string;
  role: "CITIZEN_USER" | "LAW_ENFORCEMENT" | "REGULATOR";
  isVerified: boolean;
}

export interface Guardian {
  id: string;
  ownerId: string;
  systemUserId: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  relationship: "PARENT" | "SPOUSE" | "TRUSTED_RELATIVE" | "LEGAL_GUARDIAN";
  status: "ACTIVE" | "PENDING";
  createdAt: string;
}

export interface PanicAlert {
  id: string;
  ownerId: string;
  ownerName: string;
  deviceImei: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: "TRIGGERED" | "ACKNOWLEDGED" | "DISPATCHED" | "RESOLVED";
  message: string;
}

export interface DeviceIncidentReport {
  id: string;
  guardianId: string;
  guardianName: string;
  targetDeviceImei: string;
  targetOwnerName: string;
  reportType: "DEVICE_LOST" | "OWNER_IN_DANGER";
  details: string;
  timestamp: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  dispatchRef?: string;
}

export interface MinorDeviceRegistration {
  id: string;
  guardianId: string;
  guardianName: string;
  minorName: string;
  minorAge: number;
  deviceImei: string;
  deviceModel: string;
  carrier: string;
  registeredAt: string;
  status: "ACTIVE" | "REMOTE_LOCKED" | "TRACKING_ONLY";
  autonomyLevel: "FULL_AUTONOMY";
}

// System Users Store (Guardians must be registered system users)
const SYSTEM_USERS_STORE: SystemUser[] = [
  {
    systemUserId: "sys-usr-001",
    nationalId: "28190291",
    fullName: "Sarah Jenkins",
    email: "sarah.j@example.com",
    phone: "+254711900112",
    role: "CITIZEN_USER",
    isVerified: true,
  },
  {
    systemUserId: "sys-usr-002",
    nationalId: "31092812",
    fullName: "David Jenkins",
    email: "david.j@example.com",
    phone: "+254722881900",
    role: "CITIZEN_USER",
    isVerified: true,
  },
  {
    systemUserId: "sys-usr-003",
    nationalId: "19283741",
    fullName: "Grace Muthoni",
    email: "grace.m@example.com",
    phone: "+254733112233",
    role: "CITIZEN_USER",
    isVerified: true,
  },
  {
    systemUserId: "sys-usr-004",
    nationalId: "20491823",
    fullName: "James Omondi",
    email: "james.o@example.com",
    phone: "+254744556677",
    role: "CITIZEN_USER",
    isVerified: true,
  },
];

// In-Memory Data Storage
const GUARDIANS_STORE: Guardian[] = [
  {
    id: "g-101",
    ownerId: "owner-user-01",
    systemUserId: "sys-usr-001",
    guardianName: "Sarah Jenkins",
    guardianEmail: "sarah.j@example.com",
    guardianPhone: "+254711900112",
    relationship: "SPOUSE",
    status: "ACTIVE",
    createdAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "g-102",
    ownerId: "owner-user-01",
    systemUserId: "sys-usr-002",
    guardianName: "David Jenkins",
    guardianEmail: "david.j@example.com",
    guardianPhone: "+254722881900",
    relationship: "PARENT",
    status: "ACTIVE",
    createdAt: "2026-02-12T14:30:00Z",
  },
];

const PANIC_ALERTS_STORE: PanicAlert[] = [
  {
    id: "panic-901",
    ownerId: "owner-user-01",
    ownerName: "Alexander Jenkins",
    deviceImei: "358992019921101",
    timestamp: new Date().toISOString(),
    location: {
      lat: -1.286389,
      lng: 36.817223,
      address: "Moi Avenue near Kencom House, Nairobi CBD",
    },
    status: "TRIGGERED",
    message: "EMERGENCY PANIC BUTTON DEPLOYED BY DEVICE OWNER",
  },
];

const INCIDENT_REPORTS_STORE: DeviceIncidentReport[] = [
  {
    id: "inc-401",
    guardianId: "g-101",
    guardianName: "Sarah Jenkins",
    targetDeviceImei: "358992019921101",
    targetOwnerName: "Alexander Jenkins",
    reportType: "OWNER_IN_DANGER",
    details: "Unusual off-route deviation reported via automated geofence alert.",
    timestamp: "2026-08-03T08:15:00Z",
    status: "OPEN",
  },
];

const MINOR_DEVICES_STORE: MinorDeviceRegistration[] = [
  {
    id: "minor-dev-301",
    guardianId: "g-101",
    guardianName: "Sarah Jenkins",
    minorName: "Ethan Jenkins",
    minorAge: 14,
    deviceImei: "869123049182999",
    deviceModel: "Samsung Galaxy A54",
    carrier: "Safaricom 5G",
    registeredAt: "2026-05-01T09:00:00Z",
    status: "ACTIVE",
    autonomyLevel: "FULL_AUTONOMY",
  },
];

export class GuardianService {
  /**
   * Get all registered system users
   */
  public static getSystemUsers(): SystemUser[] {
    return SYSTEM_USERS_STORE;
  }

  /**
   * Search registered system user by National ID, System User ID, Email, or Name
   */
  public static searchSystemUsers(query: string): SystemUser[] {
    if (!query.trim()) return SYSTEM_USERS_STORE;
    const q = query.toLowerCase();
    return SYSTEM_USERS_STORE.filter(
      (u) =>
        u.nationalId.toLowerCase().includes(q) ||
        u.systemUserId.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }

  /**
   * Add a registered System User as a Guardian (Max 3 limit)
   */
  public static addGuardianFromSystemUser(
    ownerId: string,
    systemUserId: string,
    relationship: Guardian["relationship"]
  ): { success: boolean; message: string; guardian?: Guardian } {
    const systemUser = SYSTEM_USERS_STORE.find((u) => u.systemUserId === systemUserId);
    if (!systemUser) {
      return {
        success: false,
        message: "Target user is not a registered System User. Only registered system users can be assigned as guardians.",
      };
    }

    const existing = this.getGuardiansForOwner(ownerId);
    if (existing.length >= 3) {
      return {
        success: false,
        message: "Maximum guardian limit reached (Max 3). You must remove an existing guardian before adding a new one.",
      };
    }

    if (existing.some((g) => g.systemUserId === systemUserId)) {
      return {
        success: false,
        message: "This system user is already designated as your guardian.",
      };
    }

    const newGuardian: Guardian = {
      id: `g-${Date.now()}`,
      ownerId,
      systemUserId: systemUser.systemUserId,
      guardianName: systemUser.fullName,
      guardianEmail: systemUser.email,
      guardianPhone: systemUser.phone,
      relationship,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    GUARDIANS_STORE.push(newGuardian);
    return {
      success: true,
      message: `${systemUser.fullName} (${systemUser.systemUserId}) successfully added as a Guardian.`,
      guardian: newGuardian,
    };
  }

  /**
   * Get guardians for a specific device owner
   */
  public static getGuardiansForOwner(ownerId: string): Guardian[] {
    return GUARDIANS_STORE.filter((g) => g.ownerId === ownerId);
  }

  /**
   * Add a new guardian (Enforces MAX 3 Guardians limit)
   */
  public static addGuardian(
    ownerId: string,
    guardianData: Omit<Guardian, "id" | "ownerId" | "status" | "createdAt">
  ): { success: boolean; message: string; guardian?: Guardian } {
    const existing = this.getGuardiansForOwner(ownerId);
    if (existing.length >= 3) {
      return {
        success: false,
        message: "Maximum guardian limit reached (Max 3). You must remove an existing guardian before adding a new one.",
      };
    }

    const newGuardian: Guardian = {
      ...guardianData,
      id: `g-${Date.now()}`,
      ownerId,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    GUARDIANS_STORE.push(newGuardian);
    return {
      success: true,
      message: "Guardian successfully added.",
      guardian: newGuardian,
    };
  }

  /**
   * Remove/replace guardian (Owner right)
   */
  public static removeGuardian(ownerId: string, guardianId: string): boolean {
    const idx = GUARDIANS_STORE.findIndex((g) => g.ownerId === ownerId && g.id === guardianId);
    if (idx !== -1) {
      GUARDIANS_STORE.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Device Owner triggers Panic Button
   */
  public static triggerPanicButton(
    ownerId: string,
    ownerName: string,
    deviceImei: string,
    location?: { lat: number; lng: number; address: string }
  ): PanicAlert {
    const newAlert: PanicAlert = {
      id: `panic-${Date.now()}`,
      ownerId,
      ownerName,
      deviceImei,
      timestamp: new Date().toISOString(),
      location: location || {
        lat: -1.286389,
        lng: 36.817223,
        address: "Nairobi Central Precinct (Live Signal)",
      },
      status: "TRIGGERED",
      message: `CRITICAL PANIC ALERT broadcasted to designated guardians of ${ownerName}`,
    };

    PANIC_ALERTS_STORE.unshift(newAlert);
    return newAlert;
  }

  /**
   * Get active Panic Alerts
   */
  public static getPanicAlerts(): PanicAlert[] {
    return PANIC_ALERTS_STORE;
  }

  /**
   * Guardian acknowledges or dispatches panic alert
   */
  public static updatePanicAlertStatus(alertId: string, status: "ACKNOWLEDGED" | "DISPATCHED" | "RESOLVED"): PanicAlert | null {
    const alert = PANIC_ALERTS_STORE.find((a) => a.id === alertId);
    if (!alert) return null;
    alert.status = status;
    return alert;
  }

  /**
   * Guardian reports device lost or owner in danger
   */
  public static reportDeviceIncident(
    guardianId: string,
    guardianName: string,
    targetDeviceImei: string,
    targetOwnerName: string,
    reportType: "DEVICE_LOST" | "OWNER_IN_DANGER",
    details: string
  ): DeviceIncidentReport {
    const report: DeviceIncidentReport = {
      id: `inc-${Date.now()}`,
      guardianId,
      guardianName,
      targetDeviceImei,
      targetOwnerName,
      reportType,
      details,
      timestamp: new Date().toISOString(),
      status: "OPEN",
      dispatchRef: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    INCIDENT_REPORTS_STORE.unshift(report);
    return report;
  }

  /**
   * Get incident reports
   */
  public static getDeviceIncidentReports(): DeviceIncidentReport[] {
    return INCIDENT_REPORTS_STORE;
  }

  /**
   * Guardian registers a device on behalf of a minor (Full Autonomy)
   */
  public static registerMinorDevice(
    guardianId: string,
    guardianName: string,
    minorData: {
      minorName: string;
      minorAge: number;
      deviceImei: string;
      deviceModel: string;
      carrier: string;
    }
  ): MinorDeviceRegistration {
    const registration: MinorDeviceRegistration = {
      id: `minor-dev-${Date.now()}`,
      guardianId,
      guardianName,
      ...minorData,
      registeredAt: new Date().toISOString(),
      status: "ACTIVE",
      autonomyLevel: "FULL_AUTONOMY",
    };

    MINOR_DEVICES_STORE.unshift(registration);
    return registration;
  }

  /**
   * Get registered minor devices
   */
  public static getMinorDevices(): MinorDeviceRegistration[] {
    return MINOR_DEVICES_STORE;
  }

  /**
   * Guardian autonomy control action on minor device (e.g. Remote Lock, Change Tracking Status)
   */
  public static updateMinorDeviceStatus(
    registrationId: string,
    status: "ACTIVE" | "REMOTE_LOCKED" | "TRACKING_ONLY"
  ): MinorDeviceRegistration | null {
    const dev = MINOR_DEVICES_STORE.find((d) => d.id === registrationId);
    if (!dev) return null;
    dev.status = status;
    return dev;
  }
}
