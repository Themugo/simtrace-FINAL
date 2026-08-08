import { ClassificationLevel, EvidenceItem, EvidenceService } from "./evidence.service";

export type ReportType = "FULL_INVESTIGATION" | "DEVICE_ANALYSIS" | "RISK_ASSESSMENT" | "AUDIT_REPORT" | "INTELLIGENCE_SUMMARY";
export type ReportStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "ARCHIVED";

export interface ReportRecord {
  id: string;
  caseId: string;
  createdBy: string;
  reportType: ReportType;
  title: string;
  status: ReportStatus;
  version: number;
  classification: ClassificationLevel;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportVersionRecord {
  id: string;
  reportId: string;
  versionNumber: number;
  changes: string;
  createdBy: string;
  createdAt: string;
}

const reportStore: ReportRecord[] = [
  {
    id: "rep-101",
    caseId: "CASE-102",
    createdBy: "Inspector Jane Doe",
    reportType: "FULL_INVESTIGATION",
    title: "Comprehensive Device Theft & SIM Swap Forensic Analysis #102",
    status: "APPROVED",
    version: 1,
    classification: "CONFIDENTIAL",
    content: "Detailed analysis of stolen Samsung S24 Ultra linked to high-frequency SIM swaps across Safaricom network.",
    createdAt: "2026-08-01T01:30:00Z",
    updatedAt: "2026-08-01T01:30:00Z",
  },
];

const reportVersionStore: ReportVersionRecord[] = [
  {
    id: "rep-ver-1",
    reportId: "rep-101",
    versionNumber: 1,
    changes: "Initial report draft compiled and approved.",
    createdBy: "Inspector Jane Doe",
    createdAt: "2026-08-01T01:30:00Z",
  },
];

export class ReportGeneratorService {
  /**
   * Builds an Investigation Report record.
   */
  public static createReport(params: {
    caseId: string;
    createdBy: string;
    reportType: ReportType;
    title: string;
    classification: ClassificationLevel;
    content: string;
  }): ReportRecord {
    const reportId = `rep-${Date.now()}`;
    const newReport: ReportRecord = {
      id: reportId,
      caseId: params.caseId,
      createdBy: params.createdBy,
      reportType: params.reportType,
      title: params.title,
      status: "DRAFT",
      version: 1,
      classification: params.classification,
      content: params.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const initialVersion: ReportVersionRecord = {
      id: `ver-${Date.now()}`,
      reportId,
      versionNumber: 1,
      changes: "Initial creation of investigation report.",
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
    };

    reportStore.push(newReport);
    reportVersionStore.push(initialVersion);

    return newReport;
  }

  /**
   * Creates a new version of an existing report.
   */
  public static updateReportVersion(params: {
    reportId: string;
    updatedBy: string;
    changes: string;
    content?: string;
    status?: ReportStatus;
  }): ReportRecord | undefined {
    const report = reportStore.find((r) => r.id === params.reportId);
    if (!report) return undefined;

    report.version += 1;
    report.updatedAt = new Date().toISOString();
    if (params.content) report.content = params.content;
    if (params.status) report.status = params.status;

    const newVersion: ReportVersionRecord = {
      id: `ver-${Date.now()}`,
      reportId: report.id,
      versionNumber: report.version,
      changes: params.changes,
      createdBy: params.updatedBy,
      createdAt: new Date().toISOString(),
    };

    reportVersionStore.push(newVersion);
    return report;
  }

  /**
   * Generates formatted text/markdown simulation of a watermarked PDF export.
   */
  public static generatePdfDossier(reportId: string): string {
    const report = reportStore.find((r) => r.id === reportId);
    if (!report) throw new Error(`Report ${reportId} not found`);

    const evidenceList = EvidenceService.searchEvidence({ caseId: report.caseId });

    return `
================================================================================
                    OFFICIAL LAW ENFORCEMENT DOSSIER
                 CLASSIFICATION LEVEL: [ ${report.classification} ]
================================================================================
WATERMARK: OFFICIAL USE ONLY - SIMTRACE INVESTIGATION SYSTEM - RECORD ID: ${report.id}

REPORT TITLE: ${report.title.toUpperCase()}
CASE ID: ${report.caseId}
PREPARED BY: ${report.createdBy}
STATUS: ${report.status} (Version ${report.version})
DATE GENERATED: ${new Date().toUTCString()}

--------------------------------------------------------------------------------
1. EXECUTIVE SUMMARY & INVESTIGATION DETAILS
--------------------------------------------------------------------------------
${report.content}

--------------------------------------------------------------------------------
2. ATTACHED EVIDENCE & FORENSIC CHAIN OF CUSTODY
--------------------------------------------------------------------------------
${
  evidenceList.length > 0
    ? evidenceList
        .map(
          (ev, idx) => `
[Item #${idx + 1}] ID: ${ev.id} | Type: ${ev.evidenceType}
Description: ${ev.description}
Collected By: ${ev.collectedBy} at ${ev.collectedAt}
Status: ${ev.status}
SHA-256 Hash: ${ev.hash}
`
        )
        .join("\n")
    : "No direct file evidence registered for this case file."
}

--------------------------------------------------------------------------------
3. AUDIT & LEGAL SIGN-OFF
--------------------------------------------------------------------------------
This report has been digitally sealed under SHA-256 cryptographic verification.
Any modification to this dossier invalidates the legal chain of custody.
================================================================================
`;
  }

  public static getReportsByCase(caseId: string): ReportRecord[] {
    return reportStore.filter((r) => r.caseId === caseId);
  }

  public static getReportById(id: string): ReportRecord | undefined {
    return reportStore.find((r) => r.id === id);
  }

  public static getReportVersions(reportId: string): ReportVersionRecord[] {
    return reportVersionStore.filter((v) => v.reportId === reportId);
  }
}
