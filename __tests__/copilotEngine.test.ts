import { describe, it, expect } from "vitest";
import { CopilotEngineService } from "../services/copilotEngine.service";

describe("Phase 14: Investigator AI Copilot, Natural Language Intelligence & Decision Support", () => {
  it("processes natural language risk breakdown queries with grounding sources", () => {
    const response = CopilotEngineService.processQuery(
      "Why is IMEI 869123049182341 flagged as critical risk?",
      "user-inspect-doe",
      "org-police-01"
    );

    expect(response.id).toContain("msg-");
    expect(response.sender).toBe("COPILOT");
    expect(response.text).toContain("Critical Risk Score");

    expect(response.riskAnalysis).toBeDefined();
    expect(response.riskAnalysis?.totalRiskScore).toBe(94);
    expect(response.riskAnalysis?.factors.length).toBeGreaterThan(0);
    expect(response.sources?.length).toBeGreaterThan(0);
  });

  it("generates AI-assisted report drafts with citations", () => {
    const response = CopilotEngineService.processQuery(
      "Draft executive report for Case KE-2026-0891",
      "user-inspect-doe",
      "org-police-01"
    );

    expect(response.reportDraft).toBeDefined();
    expect(response.reportDraft?.title).toContain("Forensic Investigation Report");
    expect(response.reportDraft?.keyFindings.length).toBeGreaterThan(0);
    expect(response.sources?.some((s) => s.type === "EVIDENCE")).toBe(true);
  });

  it("immutably logs every AI interaction in the AI_INTERACTIONS audit ledger", () => {
    const initialLogsCount = CopilotEngineService.getAIInteractionLogs().length;

    CopilotEngineService.processQuery("Recommend tactical field actions for POI-9912");

    const newLogs = CopilotEngineService.getAIInteractionLogs();
    expect(newLogs.length).toBe(initialLogsCount + 1);
    expect(newLogs[0].prompt).toContain("Recommend tactical field actions");
    expect(newLogs[0].model).toBe("gemini-2.5-flash-grounded");
  });
});
