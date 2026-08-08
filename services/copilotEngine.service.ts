export interface GroundingSource {
  id: string;
  type: "CASE" | "EVIDENCE" | "ENTITY" | "ALERT" | "SIM_SWAP" | "TOWER_LOG";
  title: string;
  referenceId: string;
  snippet: string;
}

export interface ExplainableRiskFactor {
  factor: string;
  impactScore: number; // e.g. +25
  description: string;
  evidenceRef: string;
}

export interface ExplainableRiskResponse {
  entityId: string;
  entityName: string;
  totalRiskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidencePercent: number;
  factors: ExplainableRiskFactor[];
  recommendedActions: string[];
}

export interface CopilotMessage {
  id: string;
  sender: "USER" | "COPILOT" | "SYSTEM";
  text: string;
  timestamp: string;
  sources?: GroundingSource[];
  riskAnalysis?: ExplainableRiskResponse;
  suggestedPrompts?: string[];
  reportDraft?: {
    title: string;
    executiveSummary: string;
    keyFindings: string[];
    recommendedNextSteps: string[];
  };
}

export interface AIInteractionLog {
  id: string;
  userId: string;
  organizationId: string;
  prompt: string;
  responseSnippet: string;
  sourcesCount: number;
  model: string;
  confidencePercent: number;
  createdAt: string;
}

const AI_INTERACTIONS_STORE: AIInteractionLog[] = [
  {
    id: "ai-log-101",
    userId: "user-inspect-doe",
    organizationId: "org-police-01",
    prompt: "Why is IMEI 869123049182341 flagged as critical risk?",
    responseSnippet: "Entity IMEI 869123049182341 exhibits a high risk score of 94/100 due to 3 rapid SIM swaps in 48 hours...",
    sourcesCount: 4,
    model: "gemini-2.5-flash-grounded",
    confidencePercent: 96,
    createdAt: "2026-08-02T11:10:00Z",
  },
];

export class CopilotEngineService {
  /**
   * Process a natural language query against RAG knowledge sources
   */
  public static processQuery(
    prompt: string,
    userId: string = "user-inspect-doe",
    organizationId: string = "org-police-01"
  ): CopilotMessage {
    const cleanPrompt = prompt.toLowerCase();
    let replyText = "";
    let sources: GroundingSource[] = [];
    let riskAnalysis: ExplainableRiskResponse | undefined = undefined;
    let reportDraft = undefined;

    // Simulated RAG retrieval and structured intelligence synthesis
    if (cleanPrompt.includes("risk") || cleanPrompt.includes("why")) {
      replyText = `### Explainable AI Risk Analysis

Target Entity **IMEI 869123049182341** has been analyzed with a **94/100 Critical Risk Score** (96% Confidence Level).

**Primary Contributing Factors:**
1. **Unusual SIM Swap Velocity (+35 points):** 3 SIM card changes detected within a 48-hour window on Safaricom & Airtel networks.
2. **Cell Tower Geofence Anomaly (+30 points):** Device registered at Nairobi West Tower during curfew hours while associated MSISDN was active in Mombasa.
3. **High-Risk Suspect Association (+25 points):** Direct graph edge link to Known Person of Interest #POI-KE-9912.

*Grounding Sources & Citations attached below.*`;

      riskAnalysis = {
        entityId: "imei-869123049182341",
        entityName: "IMEI 869123049182341 (Samsung Galaxy S24)",
        totalRiskScore: 94,
        riskLevel: "CRITICAL",
        confidencePercent: 96,
        factors: [
          { factor: "SIM Swap Velocity", impactScore: 35, description: "3 SIM swaps in 48 hours acrossSafcom/Airtel", evidenceRef: "EV-MOB-901" },
          { factor: "Cell Tower Anomaly", impactScore: 30, description: "Tower triangulation spatial conflict (Mombasa vs Nairobi)", evidenceRef: "TOWER-LOG-4091" },
          { factor: "High-Risk Suspect Edge", impactScore: 25, description: "Direct graph connection to Suspect #POI-9912", evidenceRef: "GRAPH-NODE-881" },
        ],
        recommendedActions: [
          "Issue immediate telecom subscriber freeze warrant on associated IMSI.",
          "Dispatch Field Unit 4 for physical cell tower site inspection.",
          "Cross-examine CDR logs with Case #KE-2026-0891 timeline.",
        ],
      };

      sources = [
        { id: "s-1", type: "SIM_SWAP", title: "SIM Swap Telemetry Event #SS-991", referenceId: "SS-991", snippet: "IMSIS 6390200... swapped on 2026-08-01 14:20:00" },
        { id: "s-2", type: "TOWER_LOG", title: "Nairobi West Sector 3 Tower Dump", referenceId: "TOWER-4091", snippet: "Handover attempt logged at lat -1.2921, lon 36.8219" },
        { id: "s-3", type: "CASE", title: "Case KE-2026-0891 (M-Pesa Syndicate)", referenceId: "CASE-0891", snippet: "Primary target device associated with fraudulent transfer logs" },
      ];
    } else if (cleanPrompt.includes("report") || cleanPrompt.includes("summary") || cleanPrompt.includes("draft")) {
      replyText = `### Automated Case Executive Brief & Report Draft

I have generated an executive summary for **Case KE-2026-0891: Sovereign M-Pesa Telecom Fraud Syndicate**.

You can review the draft below and export it to a certified PDF once verified by an authorized officer.`;

      reportDraft = {
        title: "Forensic Investigation Report: Case KE-2026-0891",
        executiveSummary: "On August 1, 2026, multi-carrier telemetry flagged an automated SIM swap attack targeting high-value financial accounts. SimTrace graph analytics connected 4 distinct MSISDNs and 2 cell towers to a single hardware IMEI enclave.",
        keyFindings: [
          "IMEI 869123049182341 served as the primary command-and-control device for 14 fraudulent SIM swaps.",
          "Cell tower triangulation confirms physical device presence in Nairobi CBD during time of execution.",
          "All evidence hashes (SHA-256) have been cryptographically sealed on the immutable audit ledger.",
        ],
        recommendedNextSteps: [
          "Submit formal court order for CDR interception to Safaricom Legal Ops.",
          "Schedule physical suspect apprehension with Anti-Cybercrime Unit.",
        ],
      };

      sources = [
        { id: "s-4", type: "EVIDENCE", title: "Forensic Mobile Dump #EV-MOB-901", referenceId: "EV-MOB-901", snippet: "Physical device mirror extract verified by Inspector Doe" },
        { id: "s-5", type: "CASE", title: "Case Details #KE-2026-0891", referenceId: "CASE-0891", snippet: "Status: Active High Priority" },
      ];
    } else {
      replyText = `Based on current intelligence records in your organization (**Kenya National Police Forensics**), I found **3 active cases**, **12 evidence items**, and **2 high-risk SIM swap alerts** linked to your query.

How would you like me to assist? I can:
- **Explain Entity Risk**: Dive deep into risk breakdown and contributing graph factors.
- **Draft Reports**: Synthesize case findings into a formal executive summary.
- **Recommend Next Steps**: Propose tactical field actions based on precedent intelligence.`;

      sources = [
        { id: "s-6", type: "ENTITY", title: "POI-KE-9912 Profile", referenceId: "POI-9912", snippet: "Subscriber name: John M. Doe (Alias: 'The Router')" },
        { id: "s-7", type: "ALERT", title: "SIM Swap Risk Alert #ALT-8812", referenceId: "ALT-8812", snippet: "Triggered 2 hours ago" },
      ];
    }

    // Log to AI_INTERACTIONS
    const logItem: AIInteractionLog = {
      id: `ai-log-${Date.now()}`,
      userId,
      organizationId,
      prompt,
      responseSnippet: replyText.slice(0, 150) + "...",
      sourcesCount: sources.length,
      model: "gemini-2.5-flash-grounded",
      confidencePercent: 95,
      createdAt: new Date().toISOString(),
    };
    AI_INTERACTIONS_STORE.unshift(logItem);

    return {
      id: `msg-${Date.now()}`,
      sender: "COPILOT",
      text: replyText,
      timestamp: new Date().toISOString(),
      sources,
      riskAnalysis,
      reportDraft,
      suggestedPrompts: [
        "Why is IMEI 869123049182341 high risk?",
        "Draft executive summary for Case KE-2026-0891",
        "Show cell tower triangulation for POI-9912",
        "Recommend next investigative actions",
      ],
    };
  }

  public static getAIInteractionLogs(): AIInteractionLog[] {
    return AI_INTERACTIONS_STORE;
  }
}
