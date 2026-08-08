import { StorageService } from "./storage.service";

export type ClassificationLevel = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "TOP_SECRET";
export type DocumentType = "CASE_REPORT" | "EVIDENCE" | "IMAGE" | "VIDEO" | "AUDIO" | "LOCATION_DATA" | "DEVICE_EXPORT" | "LEGAL_DOCUMENT";
export type EvidenceStatus = "COLLECTED" | "VERIFIED" | "UNDER_REVIEW" | "SUBMITTED" | "ARCHIVED";
export type CustodyAction = "CREATED" | "VIEWED" | "TRANSFERRED" | "DOWNLOADED" | "UPDATED" | "ARCHIVED";

export interface DocumentRecord {
  id: string;
  organizationId: string;
  caseId: string;
  uploadedBy: string;
  documentType: DocumentType;
  fileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  classificationLevel: ClassificationLevel;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  documentId: string;
  evidenceType: string;
  description: string;
  collectedBy: string;
  collectedAt: string;
  location: string;
  status: EvidenceStatus;
  hash: string;
  createdAt: string;
}

export interface CustodyLog {
  id: string;
  evidenceId: string;
  userId: string;
  userRole: string;
  action: CustodyAction;
  location: string;
  notes: string;
  timestamp: string;
}

// In-Memory Repository for Evidence & Custody
const documentStore: DocumentRecord[] = [
  {
    id: "doc-101",
    organizationId: "org-police-01",
    caseId: "CASE-102",
    uploadedBy: "Inspector Jane Doe",
    documentType: "EVIDENCE",
    fileName: "samsung_s24_forensic_dump.bin",
    storagePath: "orgs/org-police-01/documents/samsung_s24_forensic_dump.bin",
    fileSize: 1048576,
    mimeType: "application/octet-stream",
    hash: "a3b5c7d9e1f234567890abcdef1234567890abcdef1234567890abcdef123456",
    classificationLevel: "CONFIDENTIAL",
    createdAt: "2026-08-01T00:30:00Z",
    updatedAt: "2026-08-01T00:30:00Z",
  },
];

const evidenceStore: EvidenceItem[] = [
  {
    id: "ev-501",
    caseId: "CASE-102",
    documentId: "doc-101",
    evidenceType: "DEVICE_MEMORY_DUMP",
    description: "Full bit-stream binary export from Samsung S24 (IMEI358992019921101)",
    collectedBy: "Inspector Jane Doe",
    collectedAt: "2026-08-01T00:15:00Z",
    location: "Nairobi Police HQ Evidence Locker 4",
    status: "VERIFIED",
    hash: "a3b5c7d9e1f234567890abcdef1234567890abcdef1234567890abcdef123456",
    createdAt: "2026-08-01T00:30:00Z",
  },
];

const custodyLogStore: CustodyLog[] = [
  {
    id: "log-1",
    evidenceId: "ev-501",
    userId: "u1",
    userRole: "Inspector",
    action: "CREATED",
    location: "Nairobi Police HQ Evidence Locker 4",
    notes: "Initial evidence ingestion and SHA-256 hash calculation.",
    timestamp: "2026-08-01T00:30:00Z",
  },
  {
    id: "log-2",
    evidenceId: "ev-501",
    userId: "u1",
    userRole: "Inspector",
    action: "VIEWED",
    location: "Cyber Crime Unit Lab Desk 2",
    notes: "Forensic extraction preview conducted.",
    timestamp: "2026-08-01T01:00:00Z",
  },
];

export class EvidenceService {
  /**
   * Registers a new document and corresponding evidence item with chain of custody initiation.
   */
  public static async registerEvidence(params: {
    organizationId: string;
    caseId: string;
    uploadedBy: string;
    userRole: string;
    documentType: DocumentType;
    fileName: string;
    fileBuffer: Buffer;
    mimeType: string;
    classificationLevel: ClassificationLevel;
    evidenceType: string;
    description: string;
    location: string;
  }): Promise<{ document: DocumentRecord; evidence: EvidenceItem; custodyLog: CustodyLog }> {
    const uploadResult = await StorageService.uploadFile(
      params.fileName,
      params.fileBuffer,
      params.mimeType,
      params.organizationId
    );

    const docId = `doc-${Date.now()}`;
    const evId = `ev-${Date.now()}`;

    const newDoc: DocumentRecord = {
      id: docId,
      organizationId: params.organizationId,
      caseId: params.caseId,
      uploadedBy: params.uploadedBy,
      documentType: params.documentType,
      fileName: params.fileName,
      storagePath: uploadResult.storagePath,
      fileSize: uploadResult.fileSize,
      mimeType: params.mimeType,
      hash: uploadResult.hash,
      classificationLevel: params.classificationLevel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newEvidence: EvidenceItem = {
      id: evId,
      caseId: params.caseId,
      documentId: docId,
      evidenceType: params.evidenceType,
      description: params.description,
      collectedBy: params.uploadedBy,
      collectedAt: new Date().toISOString(),
      location: params.location,
      status: "VERIFIED",
      hash: uploadResult.hash,
      createdAt: new Date().toISOString(),
    };

    const newLog: CustodyLog = {
      id: `log-${Date.now()}`,
      evidenceId: evId,
      userId: params.uploadedBy,
      userRole: params.userRole,
      action: "CREATED",
      location: params.location,
      notes: `Evidence ingested into system with SHA-256 integrity hash: ${uploadResult.hash.substring(0, 16)}...`,
      timestamp: new Date().toISOString(),
    };

    documentStore.push(newDoc);
    evidenceStore.push(newEvidence);
    custodyLogStore.push(newLog);

    return { document: newDoc, evidence: newEvidence, custodyLog: newLog };
  }

  /**
   * Logs a chain of custody action (VIEWED, TRANSFERRED, DOWNLOADED, etc.)
   */
  public static logCustodyAction(params: {
    evidenceId: string;
    userId: string;
    userRole: string;
    action: CustodyAction;
    location: string;
    notes: string;
  }): CustodyLog {
    const newLog: CustodyLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      evidenceId: params.evidenceId,
      userId: params.userId,
      userRole: params.userRole,
      action: params.action,
      location: params.location,
      notes: params.notes,
      timestamp: new Date().toISOString(),
    };
    custodyLogStore.push(newLog);
    return newLog;
  }

  /**
   * Searches evidence items with multi-parameter filtering.
   */
  public static searchEvidence(query: {
    caseId?: string;
    search?: string;
    status?: EvidenceStatus;
    classification?: ClassificationLevel;
  }): EvidenceItem[] {
    return evidenceStore.filter((ev) => {
      if (query.caseId && ev.caseId !== query.caseId) return false;
      if (query.status && ev.status !== query.status) return false;

      if (query.search) {
        const term = query.search.toLowerCase();
        const matchesType = ev.evidenceType.toLowerCase().includes(term);
        const matchesDesc = ev.description.toLowerCase().includes(term);
        const matchesCollector = ev.collectedBy.toLowerCase().includes(term);
        const matchesId = ev.id.toLowerCase().includes(term) || ev.caseId.toLowerCase().includes(term);
        if (!matchesType && !matchesDesc && !matchesCollector && !matchesId) return false;
      }

      return true;
    });
  }

  public static getCustodyLogs(evidenceId: string): CustodyLog[] {
    return custodyLogStore.filter((log) => log.evidenceId === evidenceId);
  }

  public static getEvidenceById(id: string): EvidenceItem | undefined {
    return evidenceStore.find((e) => e.id === id);
  }

  public static getDocumentById(id: string): DocumentRecord | undefined {
    return documentStore.find((d) => d.id === id);
  }

  public static getAllDocuments(): DocumentRecord[] {
    return documentStore;
  }
}
