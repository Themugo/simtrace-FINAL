// services/recovery.js - Autonomous Recovery Network
// Network of recovery agents and automated recovery workflows

import { RecoveryAgent, RecoveryCase, Device, User } from "../db/index.js";
import { getIO } from "./socket.js";
import { recordDeviceRecovered } from "./blockchain.js";

// ── Agent Management ───────────────────────────────────────────────────────────────
export async function registerRecoveryAgent(data) {
  const {
    name,
    type,
    email,
    phone,
    location,
    capabilities,
    partnerOrg,
  } = data;

  const agent = await RecoveryAgent.create({
    name,
    type,
    email,
    phone,
    location,
    capabilities,
    partnerOrg,
    verified: false,
    backgroundCheck: false,
    totalCases: 0,
    successfulRecoveries: 0,
    successRate: 0,
    avgResponseTime: 0,
    available: true,
    currentLoad: 0,
  });

  return agent;
}

export async function updateAgentMetrics(agentId) {
  const agent = await RecoveryAgent.findById(agentId);
  if (!agent) throw new Error("Agent not found");

  const cases = await RecoveryCase.find({
    assignedAgents: agentId,
    status: { $in: ["recovered", "failed", "closed"] },
  });

  const totalCases = cases.length;
  const successfulRecoveries = cases.filter(c => c.status === "recovered").length;
  const successRate = totalCases > 0 ? (successfulRecoveries / totalCases) * 100 : 0;

  // Calculate average response time
  const responseTimes = cases
    .filter(c => c.workflowSteps[0]?.completedAt)
    .map(c => {
      const created = new Date(c.createdAt).getTime();
      const firstStep = new Date(c.workflowSteps[0].completedAt).getTime();
      return (firstStep - created) / (1000 * 60 * 60); // hours
    });
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  agent.totalCases = totalCases;
  agent.successfulRecoveries = successfulRecoveries;
  agent.successRate = successRate;
  agent.avgResponseTime = avgResponseTime;
  agent.updatedAt = new Date();

  await agent.save();
  return agent;
}

export async function findAvailableAgents(criteria = {}) {
  const {
    location,
    capabilities,
    type,
    maxLoad = 5,
  } = criteria;

  const query = {
    available: true,
    currentLoad: { $lt: maxLoad },
    verified: true,
  };

  if (type) query.type = type;
  if (capabilities) query.capabilities = { $all: capabilities };

  // If location provided, find agents within radius
  if (location && location.lat && location.lng) {
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
        $maxDistance: 50000, // 50km radius
      },
    };
  }

  const agents = await RecoveryAgent.find(query)
    .sort({ successRate: -1, currentLoad: 1 })
    .limit(10);

  return agents;
}

// ── Recovery Case Management ───────────────────────────────────────────────────────
export async function createRecoveryCase(data) {
  const {
    imei,
    reportedBy,
    priority = "medium",
    recoveryFee,
    rewardOffered,
  } = data;

  const device = await Device.findOne({ imei });
  if (!device) throw new Error("Device not found");

  const user = await User.findById(reportedBy);
  if (!user) throw new Error("User not found");

  // Get last known location from device
  const lastKnownLocation = device.lastSeen
    ? { lat: null, lng: null, accuracy: null, timestamp: device.lastSeen }
    : null;

  const recoveryCase = await RecoveryCase.create({
    imei,
    device: device._id,
    reportedBy,
    status: "open",
    priority,
    lastKnownLocation,
    currentLocation: lastKnownLocation,
    assignedAgents: [],
    workflowSteps: [],
    communications: [],
    recoveryFee,
    rewardOffered,
    rewardPaid: 0,
    crossBorder: false,
    createdAt: new Date(),
  });

  // Auto-assign agents based on location and priority
  await autoAssignAgents(recoveryCase._id);

  // Notify via socket
  getIO().emit("recovery_case_created", {
    caseId: recoveryCase._id,
    imei,
    priority,
  });

  return recoveryCase;
}

export async function autoAssignAgents(caseId) {
  const recoveryCase = await RecoveryCase.findById(caseId).populate("device");
  if (!recoveryCase) throw new Error("Recovery case not found");

  // Find available agents near the device's last known location
  const agents = await findAvailableAgents({
    location: recoveryCase.lastKnownLocation,
    capabilities: ["physical_recovery"],
    maxLoad: recoveryCase.priority === "critical" ? 3 : 5,
  });

  if (agents.length === 0) {
    // No local agents, expand search
    const expandedAgents = await findAvailableAgents({
      capabilities: ["physical_recovery"],
      maxLoad: 8,
    });
    if (expandedAgents.length > 0) {
      await assignAgentsToCase(caseId, expandedAgents.slice(0, 3));
    }
  } else {
    await assignAgentsToCase(caseId, agents.slice(0, Math.min(agents.length, 3)));
  }

  return recoveryCase;
}

export async function assignAgentsToCase(caseId, agents) {
  const recoveryCase = await RecoveryCase.findById(caseId);
  if (!recoveryCase) throw new Error("Recovery case not found");

  const agentIds = agents.map(a => a._id);
  recoveryCase.assignedAgents = agentIds;
  recoveryCase.primaryAgent = agents[0]._id;
  recoveryCase.status = "assigned";

  // Add workflow step
  recoveryCase.workflowSteps.push({
    step: "agents_assigned",
    status: "completed",
    completedAt: new Date(),
    notes: `${agents.length} agents assigned`,
    agent: agents[0]._id,
  });

  // Update agent loads
  await RecoveryAgent.updateMany(
    { _id: { $in: agentIds } },
    { $inc: { currentLoad: 1 } }
  );

  await recoveryCase.save();

  // Notify agents via socket
  getIO().to("role:admin").emit("recovery_case_assigned", {
    caseId,
    agents: agentIds,
  });

  return recoveryCase;
}

export async function updateCaseStatus(caseId, status, notes, agentId) {
  const recoveryCase = await RecoveryCase.findById(caseId);
  if (!recoveryCase) throw new Error("Recovery case not found");

  recoveryCase.status = status;
  recoveryCase.updatedAt = new Date();

  // Add workflow step
  recoveryCase.workflowSteps.push({
    step: `status_${status}`,
    status: "completed",
    completedAt: new Date(),
    notes,
    agent: agentId,
  });

  // If recovered, record on blockchain
  if (status === "recovered") {
    recoveryCase.recoveredAt = new Date();
    recoveryCase.outcome = "Device successfully recovered";
    
    await recordDeviceRecovered(
      recoveryCase.imei,
      recoveryCase.reportedBy
    );

    // Update agent metrics
    for (const agentId of recoveryCase.assignedAgents) {
      await updateAgentMetrics(agentId);
    }

    // Release agents
    await RecoveryAgent.updateMany(
      { _id: { $in: recoveryCase.assignedAgents } },
      { $inc: { currentLoad: -1 } }
    );
  }

  await recoveryCase.save();

  // Notify via socket
  getIO().emit("recovery_case_updated", {
    caseId,
    status,
    imei: recoveryCase.imei,
  });

  return recoveryCase;
}

export async function addCommunication(caseId, communication) {
  const recoveryCase = await RecoveryCase.findById(caseId);
  if (!recoveryCase) throw new Error("Recovery case not found");

  recoveryCase.communications.push({
    ...communication,
    timestamp: new Date(),
  });

  await recoveryCase.save();
  return recoveryCase;
}

export async function updateCaseLocation(caseId, location) {
  const recoveryCase = await RecoveryCase.findById(caseId);
  if (!recoveryCase) throw new Error("Recovery case not found");

  recoveryCase.currentLocation = {
    ...location,
    timestamp: new Date(),
  };
  recoveryCase.updatedAt = new Date();

  await recoveryCase.save();

  // Notify via socket for real-time tracking
  getIO().emit("recovery_location_update", {
    caseId,
    imei: recoveryCase.imei,
    location,
  });

  return recoveryCase;
}

// ── Case Queries ─────────────────────────────────────────────────────────────────
export async function getRecoveryCase(caseId) {
  const recoveryCase = await RecoveryCase.findById(caseId)
    .populate("device")
    .populate("reportedBy", "name email")
    .populate("assignedAgents")
    .populate("primaryAgent")
    .populate("ledgerEntry");

  return recoveryCase;
}

export async function getRecoveryCasesByUser(userId) {
  const cases = await RecoveryCase.find({ reportedBy: userId })
    .populate("device")
    .sort({ createdAt: -1 });

  return cases;
}

export async function getRecoveryCasesByAgent(agentId) {
  const cases = await RecoveryCase.find({ assignedAgents: agentId })
    .populate("device")
    .populate("reportedBy", "name email")
    .sort({ createdAt: -1 });

  return cases;
}

export async function getActiveCases() {
  const cases = await RecoveryCase.find({
    status: { $in: ["open", "assigned", "in_progress", "negotiating"] },
  })
    .populate("device")
    .populate("assignedAgents")
    .sort({ priority: -1, createdAt: -1 });

  return cases;
}

// ── Recovery Statistics ─────────────────────────────────────────────────────────────
export async function getRecoveryStatistics() {
  const [
    totalCases,
    openCases,
    assignedCases,
    inProgressCases,
    recoveredCases,
    failedCases,
    totalAgents,
    availableAgents,
  ] = await Promise.all([
    RecoveryCase.countDocuments(),
    RecoveryCase.countDocuments({ status: "open" }),
    RecoveryCase.countDocuments({ status: "assigned" }),
    RecoveryCase.countDocuments({ status: "in_progress" }),
    RecoveryCase.countDocuments({ status: "recovered" }),
    RecoveryCase.countDocuments({ status: "failed" }),
    RecoveryAgent.countDocuments(),
    RecoveryAgent.countDocuments({ available: true }),
  ]);

  const totalClosed = recoveredCases + failedCases;
  const recoveryRate = totalClosed > 0 
    ? ((recoveredCases / totalClosed) * 100).toFixed(2) 
    : 0;

  const avgResolutionTime = await RecoveryCase.aggregate([
    { $match: { status: { $in: ["recovered", "failed", "closed"] } } },
    {
      $project: {
        resolutionTime: {
          $subtract: ["$recoveredAt", "$createdAt"],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgTime: { $avg: "$resolutionTime" },
      },
    },
  ]);

  return {
    totalCases,
    openCases,
    assignedCases,
    inProgressCases,
    recoveredCases,
    failedCases,
    totalClosed,
    recoveryRate,
    totalAgents,
    availableAgents,
    avgResolutionTime: avgResolutionTime[0]?.avgTime 
      ? Math.round(avgResolutionTime[0].avgTime / (1000 * 60 * 60)) // hours
      : 0,
  };
}

// ── Autonomous Recovery Workflow ───────────────────────────────────────────────────
export async function runAutonomousRecovery(caseId) {
  const recoveryCase = await RecoveryCase.findById(caseId).populate("device");
  if (!recoveryCase) throw new Error("Recovery case not found");

  // Step 1: Analyze device location data
  recoveryCase.workflowSteps.push({
    step: "location_analysis",
    status: "in_progress",
    completedAt: null,
    notes: "Analyzing device location patterns",
  });
  await recoveryCase.save();

  // Simulate analysis
  await new Promise(resolve => setTimeout(resolve, 1000));

  recoveryCase.workflowSteps[recoveryCase.workflowSteps.length - 1].status = "completed";
  recoveryCase.workflowSteps[recoveryCase.workflowSteps.length - 1].completedAt = new Date();
  recoveryCase.workflowSteps[recoveryCase.workflowSteps.length - 1].notes = "Location analysis complete - device in Nairobi area";
  await recoveryCase.save();

  // Step 2: Identify nearby agents
  recoveryCase.workflowSteps.push({
    step: "agent_identification",
    status: "in_progress",
    completedAt: null,
    notes: "Identifying nearby recovery agents",
  });
  await recoveryCase.save();

  await autoAssignAgents(caseId);

  recoveryCase.workflowSteps[recoveryCase.workflowSteps.length - 1].status = "completed";
  recoveryCase.workflowSteps[recoveryCase.workflowSteps.length - 1].completedAt = new Date();
  recoveryCase.workflowSteps[recoveryCase.workflowSteps.length - 1].notes = "Agents identified and assigned";
  await recoveryCase.save();

  // Step 3: Initiate contact
  recoveryCase.status = "in_progress";
  await recoveryCase.save();

  return recoveryCase;
}
