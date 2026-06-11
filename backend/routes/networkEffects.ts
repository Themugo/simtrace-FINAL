// routes/networkEffects.ts - API endpoints for network effects features
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { crowdSourcedTrackingService } from "../services/networkEffects/crowdSourcedTracking.js";
import { insuranceIntegrationService } from "../services/networkEffects/insuranceIntegration.js";
import { smartContractBountyService } from "../services/networkEffects/smartContractBounties.js";
import { socialNetworkAnalysisService } from "../services/networkEffects/socialNetworkAnalysis.js";
import { droneIntegrationService } from "../services/networkEffects/droneIntegration.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Crowd-Sourced Tracking ─────────────────────────────────────────────────────

router.post("/crowd/register", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const participant = crowdSourcedTrackingService.registerParticipant(userId);
    res.json({ participant });
  } catch (err) {
    next(err);
  }
});

router.post("/crowd/sighting", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number()
      }),
      photo: z.string().optional(),
      notes: z.string().optional()
    });
    const { deviceId, imei, location, photo, notes } = schema.parse(req.body);

    const reporterId = req.user?.id;
    if (!reporterId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sighting = crowdSourcedTrackingService.submitSighting(deviceId, imei, reporterId, location, photo, notes);
    res.json({ sighting });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/crowd/sighting/:sightingId/verify", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      verified: z.boolean()
    });
    const { verified } = schema.parse(req.body);
    const sightingId = req.params.sightingId as string;

    const success = crowdSourcedTrackingService.verifySighting(sightingId, verified);
    
    if (!success) {
      return res.status(400).json({ error: "Failed to verify sighting" });
    }

    res.json({ success });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/crowd/campaign", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      rewardAmount: z.number(),
      ttl: z.number().optional()
    });
    const { deviceId, imei, rewardAmount, ttl } = schema.parse(req.body);

    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const campaign = crowdSourcedTrackingService.createCampaign(deviceId, imei, ownerId, rewardAmount, ttl);
    res.json({ campaign });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/crowd/device/:deviceId/sightings", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.params.deviceId as string;
    const verifiedOnly = req.query.verified === 'true';
    const sightings = crowdSourcedTrackingService.getSightingsForDevice(deviceId, verifiedOnly);
    res.json({ sightings });
  } catch (err) {
    next(err);
  }
});

router.post("/crowd/sighting/:sightingId/claim", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sightingId = req.params.sightingId as string;
    const result = crowdSourcedTrackingService.claimReward(sightingId);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.get("/crowd/leaderboard", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const leaderboard = crowdSourcedTrackingService.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
});

router.get("/crowd/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = crowdSourcedTrackingService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Insurance Integration ───────────────────────────────────────────────────────

router.post("/insurance/provider", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      countryCode: z.string(),
      apiEndpoint: z.string(),
      contactEmail: z.string(),
      contactPhone: z.string(),
      supportedPolicies: z.array(z.string()),
      isActive: z.boolean().default(true),
      averageClaimTime: z.number().default(0),
      successRate: z.number().default(0)
    });
    const data = schema.parse(req.body);

    const provider = insuranceIntegrationService.registerProvider(data);
    res.json({ provider });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/insurance/policy", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      providerId: z.string(),
      policyType: z.enum(['theft', 'damage', 'loss', 'comprehensive']),
      coverageAmount: z.number(),
      premium: z.number(),
      deductible: z.number(),
      duration: z.number().optional()
    });
    const data = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const policy = insuranceIntegrationService.createPolicy(
      data.deviceId,
      data.imei,
      userId,
      data.providerId,
      data.policyType,
      data.coverageAmount,
      data.premium,
      data.deductible,
      data.duration
    );
    res.json({ policy });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/insurance/claim", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      policyId: z.string(),
      claimType: z.enum(['theft', 'damage', 'loss']),
      incidentDate: z.number(),
      amount: z.number(),
      evidence: z.array(z.string()),
      description: z.string(),
      policeReportNumber: z.string().optional()
    });
    const data = schema.parse(req.body);

    const claim = insuranceIntegrationService.submitClaim(
      data.policyId,
      data.claimType,
      data.incidentDate,
      data.amount,
      data.evidence,
      data.description,
      data.policeReportNumber
    );
    res.json({ claim });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/insurance/claim/:claimId/process", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const claimId = req.params.claimId as string;
    const claim = await insuranceIntegrationService.processClaim(claimId);
    res.json({ claim });
  } catch (err) {
    next(err);
  }
});

router.get("/insurance/policies", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const policies = insuranceIntegrationService.getPoliciesForUser(userId);
    res.json({ policies });
  } catch (err) {
    next(err);
  }
});

router.get("/insurance/claims", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claims = insuranceIntegrationService.getClaimsForUser(userId);
    res.json({ claims });
  } catch (err) {
    next(err);
  }
});

router.get("/insurance/providers", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const providers = insuranceIntegrationService.getActiveProviders();
    res.json({ providers });
  } catch (err) {
    next(err);
  }
});

router.get("/insurance/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = insuranceIntegrationService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Smart Contract Bounties ─────────────────────────────────────────────────────

router.post("/bounty/contract", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      imei: z.string(),
      bountyAmount: z.number(),
      currency: z.enum(['ETH', 'BTC', 'USDC', 'USDT']).optional(),
      blockchain: z.enum(['ethereum', 'bitcoin', 'polygon', 'bsc']).optional(),
      ttl: z.number().optional()
    });
    const data = schema.parse(req.body);

    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const contract = smartContractBountyService.createContract(
      data.deviceId,
      data.imei,
      ownerId,
      data.bountyAmount,
      data.currency,
      data.blockchain,
      data.ttl
    );
    res.json({ contract });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/bounty/claim", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      contractId: z.string(),
      evidence: z.array(z.string()),
      location: z.object({
        latitude: z.number(),
        longitude: z.number()
      })
    });
    const data = schema.parse(req.body);

    const claimantId = req.user?.id;
    if (!claimantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const claim = smartContractBountyService.submitClaim(
      data.contractId,
      claimantId,
      data.evidence,
      data.location
    );
    res.json({ claim });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/bounty/claim/:claimId/verify", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      verified: z.boolean()
    });
    const { verified } = schema.parse(req.body);
    const claimId = req.params.claimId as string;

    const success = smartContractBountyService.verifyClaim(claimId, verified);
    
    if (!success) {
      return res.status(400).json({ error: "Failed to verify claim" });
    }

    res.json({ success });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/bounty/contracts", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const contracts = smartContractBountyService.getContractsForOwner(ownerId);
    res.json({ contracts });
  } catch (err) {
    next(err);
  }
});

router.get("/bounty/active", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const contracts = smartContractBountyService.getActiveContracts();
    res.json({ contracts });
  } catch (err) {
    next(err);
  }
});

router.get("/bounty/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = smartContractBountyService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Social Network Analysis ─────────────────────────────────────────────────────

router.post("/sna/node", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      type: z.enum(['device', 'user', 'location', 'imei']),
      data: z.any(),
      riskScore: z.number().optional()
    });
    const { type, data, riskScore } = schema.parse(req.body);

    const node = socialNetworkAnalysisService.addNode(type, data, riskScore);
    res.json({ node });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/sna/edge", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      sourceId: z.string(),
      targetId: z.string(),
      edgeType: z.enum(['ownership', 'location', 'transaction', 'contact', 'theft']),
      weight: z.number().optional()
    });
    const { sourceId, targetId, edgeType, weight } = schema.parse(req.body);

    const edge = socialNetworkAnalysisService.addEdge(sourceId, targetId, edgeType, weight);
    res.json({ edge });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/sna/analyze", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patterns = socialNetworkAnalysisService.analyzePatterns();
    res.json({ patterns });
  } catch (err) {
    next(err);
  }
});

router.get("/sna/node/:nodeId/risk", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const nodeId = req.params.nodeId as string;
    const riskScore = socialNetworkAnalysisService.getNodeRisk(nodeId);
    res.json({ riskScore });
  } catch (err) {
    next(err);
  }
});

router.get("/sna/node/:nodeId/patterns", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const nodeId = req.params.nodeId as string;
    const patterns = socialNetworkAnalysisService.getPatternsForNode(nodeId);
    res.json({ patterns });
  } catch (err) {
    next(err);
  }
});

router.get("/sna/clusters", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const clusters = socialNetworkAnalysisService.detectClusters();
    res.json({ clusters });
  } catch (err) {
    next(err);
  }
});

router.get("/sna/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = socialNetworkAnalysisService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

// ── Drone Integration ─────────────────────────────────────────────────────────

router.post("/drone/register", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      model: z.string(),
      capabilities: z.array(z.string()),
      maxRange: z.number(),
      maxFlightTime: z.number()
    });
    const { name, model, capabilities, maxRange, maxFlightTime } = schema.parse(req.body);

    const operatorId = req.user?.id;
    if (!operatorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const drone = droneIntegrationService.registerDrone(name, model, operatorId, capabilities, maxRange, maxFlightTime);
    res.json({ drone });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/drone/mission", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      targetLocation: z.object({
        latitude: z.number(),
        longitude: z.number()
      }),
      missionType: z.enum(['search', 'surveillance', 'tracking', 'recovery']),
      priority: z.enum(['low', 'normal', 'high', 'emergency']).optional()
    });
    const { deviceId, targetLocation, missionType, priority } = schema.parse(req.body);

    const mission = droneIntegrationService.createMission(deviceId, targetLocation, missionType, priority);
    res.json({ mission });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/drone/mission/:missionId/start", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const missionId = req.params.missionId as string;
    const success = droneIntegrationService.startMission(missionId);
    
    if (!success) {
      return res.status(400).json({ error: "Failed to start mission" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/drone/mission/:missionId/complete", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      findings: z.array(z.string()),
      footage: z.array(z.string())
    });
    const { findings, footage } = schema.parse(req.body);
    const missionId = req.params.missionId as string;

    const success = droneIntegrationService.completeMission(missionId, findings, footage);
    
    if (!success) {
      return res.status(400).json({ error: "Failed to complete mission" });
    }

    res.json({ success });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/drone/mission/:missionId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const missionId = req.params.missionId as string;
    const mission = droneIntegrationService.getMission(missionId);
    
    if (!mission) {
      return res.status(404).json({ error: "Mission not found" });
    }

    res.json({ mission });
  } catch (err) {
    next(err);
  }
});

router.get("/drone/missions", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.query.deviceId as string | undefined;
    
    if (deviceId) {
      const missions = droneIntegrationService.getMissionsForDevice(deviceId);
      res.json({ missions });
    } else {
      const operatorId = req.user?.id;
      if (!operatorId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const drones = droneIntegrationService.getDronesByOperator(operatorId);
      const allMissions: any[] = [];
      
      for (const drone of drones) {
        const missions = droneIntegrationService.getMissionsForDrone(drone.droneId);
        allMissions.push(...missions);
      }
      
      res.json({ missions: allMissions });
    }
  } catch (err) {
    next(err);
  }
});

router.get("/drone/drones", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const operatorId = req.user?.id;
    if (!operatorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const drones = droneIntegrationService.getDronesByOperator(operatorId);
    res.json({ drones });
  } catch (err) {
    next(err);
  }
});

router.get("/drone/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = droneIntegrationService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

export default router;
