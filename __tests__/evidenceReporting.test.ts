import { describe, it, expect } from "vitest";
import { StorageService } from "../services/storage.service";
import { EvidenceService } from "../services/evidence.service";
import { ReportGeneratorService } from "../services/reportGenerator.service";

describe("Phase 7: Evidence, Chain of Custody & Reporting Engine", () => {
  it("computes accurate SHA-256 hashes for file data", () => {
    const content = Buffer.from("SimTrace Forensic Device Log Data 2026");
    const hash = StorageService.generateHash(content);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 hex length
    expect(StorageService.verifyFileHash(content, hash)).toBe(true);
  });

  it("registers evidence and logs chain of custody creation", async () => {
    const fileContent = Buffer.from("Forensic image data from target device");
    const result = await EvidenceService.registerEvidence({
      organizationId: "org-police-01",
      caseId: "CASE-102",
      uploadedBy: "Inspector Jane Doe",
      userRole: "Lead Investigator",
      documentType: "EVIDENCE",
      fileName: "device_dump.bin",
      fileBuffer: fileContent,
      mimeType: "application/octet-stream",
      classificationLevel: "RESTRICTED",
      evidenceType: "MEMORY_DUMP",
      description: "Memory dump of IMEI358992019921101",
      location: "HQ Locker 4",
    });

    expect(result.document.hash).toBe(StorageService.generateHash(fileContent));
    expect(result.evidence.caseId).toBe("CASE-102");
    expect(result.custodyLog.action).toBe("CREATED");

    // Add custody log entry
    const transferLog = EvidenceService.logCustodyAction({
      evidenceId: result.evidence.id,
      userId: "u2",
      userRole: "Forensic Specialist",
      action: "TRANSFERRED",
      location: "Lab Desk 3",
      notes: "Transferred for deep hex analysis.",
    });

    expect(transferLog.action).toBe("TRANSFERRED");
    const allLogs = EvidenceService.getCustodyLogs(result.evidence.id);
    expect(allLogs.length).toBe(2);
  });

  it("creates investigation reports and generates watermarked dossiers", () => {
    const report = ReportGeneratorService.createReport({
      caseId: "CASE-102",
      createdBy: "Inspector Jane Doe",
      reportType: "FULL_INVESTIGATION",
      title: "Target IMEI SIM Swap Analysis",
      classification: "CONFIDENTIAL",
      content: "Found 8 SIM swaps within 48 hours.",
    });

    expect(report.version).toBe(1);
    expect(report.status).toBe("DRAFT");

    const pdfDossier = ReportGeneratorService.generatePdfDossier(report.id);
    expect(pdfDossier).toContain("OFFICIAL LAW ENFORCEMENT DOSSIER");
    expect(pdfDossier).toContain("CLASSIFICATION LEVEL: [ CONFIDENTIAL ]");
    expect(pdfDossier.toUpperCase()).toContain("TARGET IMEI SIM SWAP ANALYSIS");

    const updatedReport = ReportGeneratorService.updateReportVersion({
      reportId: report.id,
      updatedBy: "Chief Supervisor",
      changes: "Approved and finalized for prosecutor submission.",
      status: "APPROVED",
    });

    expect(updatedReport?.version).toBe(2);
    expect(updatedReport?.status).toBe("APPROVED");
  });
});
