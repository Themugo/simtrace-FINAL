import { EntityModel, EntityType, IEntity } from "../models/entity.model.js";
import { RelationshipModel, RelationshipType, IRelationship } from "../models/relationship.model.js";
import { IntelligenceEventModel } from "../intelligenceEvent.model.js";
import { RiskAssessmentModel, RiskLevel } from "../models/riskAssessment.model.js";
import { RedisService } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";

export class IntelligenceGraphService {
  /**
   * Create or update graph entity
   */
  static async createEntity(data: {
    entityType: EntityType;
    externalId: string;
    name: string;
    organizationId?: string;
    metadata?: Record<string, any>;
  }): Promise<IEntity> {
    try {
      const existing = await EntityModel.findOne({
        entityType: data.entityType,
        externalId: data.externalId,
      });

      if (existing) {
        existing.name = data.name || existing.name;
        if (data.metadata) {
          existing.metadata = { ...existing.metadata, ...data.metadata };
        }
        await existing.save();
        await RedisService.del(`graph_entity:${existing._id}`);
        return existing;
      }

      const entity = await EntityModel.create({
        entityType: data.entityType,
        externalId: data.externalId,
        name: data.name,
        organizationId: data.organizationId,
        metadata: data.metadata || {},
      });

      await this.recordEvent(entity._id.toString(), "ENTITY_CREATED", "graph-engine", {
        entityType: data.entityType,
        externalId: data.externalId,
      });

      return entity;
    } catch (err: any) {
      logger.error(`[IntelligenceGraph] createEntity error: ${err.message}`);
      throw AppError.internal("Failed to create entity in graph", err);
    }
  }

  /**
   * Create relationship between two entities
   */
  static async createRelationship(data: {
    sourceEntityId: string;
    targetEntityId: string;
    relationshipType: RelationshipType;
    confidenceScore?: number;
    metadata?: Record<string, any>;
  }): Promise<IRelationship> {
    try {
      const rel = await RelationshipModel.findOneAndUpdate(
        {
          sourceEntityId: data.sourceEntityId,
          targetEntityId: data.targetEntityId,
          relationshipType: data.relationshipType,
        },
        {
          confidenceScore: data.confidenceScore ?? 1.0,
          metadata: data.metadata || {},
          createdAt: new Date(),
        },
        { upsert: true, new: true }
      );

      await this.recordEvent(data.sourceEntityId, "RELATIONSHIP_LINKED", "graph-engine", {
        targetEntityId: data.targetEntityId,
        relationshipType: data.relationshipType,
      });

      // Clear graph cache
      await RedisService.del(`graph_viz:${data.sourceEntityId}`);
      await RedisService.del(`graph_viz:${data.targetEntityId}`);

      // Evaluate automated rules engine
      await this.evaluateAutoRelationships(data.sourceEntityId);

      return rel;
    } catch (err: any) {
      logger.error(`[IntelligenceGraph] createRelationship error: ${err.message}`);
      throw AppError.internal("Failed to establish graph relationship", err);
    }
  }

  /**
   * Find 1-hop and 2-hop connections for an entity
   */
  static async findConnections(entityId: string): Promise<{
    entity: IEntity;
    directConnections: Array<{ relationship: IRelationship; entity: IEntity }>;
    secondaryConnections: Array<{ relationship: IRelationship; entity: IEntity }>;
  }> {
    const cacheKey = `graph_connections:${entityId}`;
    const cached = await RedisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const entity = await EntityModel.findById(entityId);
    if (!entity) {
      throw AppError.notFound(`Entity ${entityId} not found`);
    }

    // Direct relationships (Outbound & Inbound)
    const outboundRels = await RelationshipModel.find({ sourceEntityId: entityId });
    const inboundRels = await RelationshipModel.find({ targetEntityId: entityId });

    const directTargetIds = outboundRels.map((r) => r.targetEntityId);
    const directSourceIds = inboundRels.map((r) => r.sourceEntityId);
    const allDirectIds = Array.from(new Set([...directTargetIds, ...directSourceIds]));

    const directEntities = await EntityModel.find({ _id: { $in: allDirectIds } });
    const entityMap = new Map<string, IEntity>();
    directEntities.forEach((e) => entityMap.set(e._id.toString(), e));

    const directConnections: Array<{ relationship: IRelationship; entity: IEntity }> = [];
    outboundRels.forEach((r) => {
      const target = entityMap.get(r.targetEntityId);
      if (target) directConnections.push({ relationship: r, entity: target });
    });
    inboundRels.forEach((r) => {
      const source = entityMap.get(r.sourceEntityId);
      if (source) directConnections.push({ relationship: r, entity: source });
    });

    // Secondary relationships (2-hop)
    const secondaryRels = await RelationshipModel.find({
      $or: [{ sourceEntityId: { $in: allDirectIds } }, { targetEntityId: { $in: allDirectIds } }],
      _id: { $nin: [...outboundRels.map((r) => r._id), ...inboundRels.map((r) => r._id)] },
    }).limit(50);

    const secondaryIds = Array.from(
      new Set([
        ...secondaryRels.map((r) => r.sourceEntityId),
        ...secondaryRels.map((r) => r.targetEntityId),
      ])
    ).filter((id) => id !== entityId && !allDirectIds.includes(id));

    const secondaryEntities = await EntityModel.find({ _id: { $in: secondaryIds } });
    const secondaryEntityMap = new Map<string, IEntity>();
    secondaryEntities.forEach((e) => secondaryEntityMap.set(e._id.toString(), e));

    const secondaryConnections: Array<{ relationship: IRelationship; entity: IEntity }> = [];
    secondaryRels.forEach((r) => {
      const target = secondaryEntityMap.get(r.targetEntityId) || secondaryEntityMap.get(r.sourceEntityId);
      if (target) secondaryConnections.push({ relationship: r, entity: target });
    });

    const result = {
      entity,
      directConnections,
      secondaryConnections,
    };

    await RedisService.set(cacheKey, JSON.stringify(result), 300); // 5 min cache
    return result;
  }

  /**
   * Get intelligence timeline of an entity
   */
  static async getEntityTimeline(entityId: string): Promise<any[]> {
    return IntelligenceEventModel.find({ entityId }).sort({ timestamp: -1 }).limit(100);
  }

  /**
   * Calculate intelligence risk score
   */
  static async calculateRiskScore(entityId: string): Promise<{ score: number; level: RiskLevel; factors: any[] }> {
    const entity = await EntityModel.findById(entityId);
    if (!entity) throw AppError.notFound("Entity not found");

    const factors: Array<{ factor: string; points: number; description: string }> = [];
    let score = 0;

    // Rule 1: Multiple SIM Swaps
    const simRels = await RelationshipModel.find({
      sourceEntityId: entityId,
      relationshipType: "DEVICE_USED_SIM",
    });
    if (simRels.length > 3) {
      const pts = Math.min((simRels.length - 2) * 20, 60);
      score += pts;
      factors.push({
        factor: "MULTIPLE_SIM_SWAPS",
        points: pts,
        description: `Device connected to ${simRels.length} distinct SIM cards`,
      });
    }

    // Rule 2: Multi-case linkage
    const caseRels = await RelationshipModel.find({
      sourceEntityId: entityId,
      relationshipType: "DEVICE_LINKED_TO_CASE",
    });
    if (caseRels.length > 0) {
      const pts = caseRels.length * 35;
      score += pts;
      factors.push({
        factor: "ACTIVE_CASE_LINKAGE",
        points: pts,
        description: `Entity linked to ${caseRels.length} active police investigations`,
      });
    }

    // Rule 3: Blacklist status
    if (entity.status === "blacklisted" || entity.status === "stolen") {
      score += 80;
      factors.push({
        factor: "BLACKLISTED_STATUS",
        points: 80,
        description: "Entity flagged as stolen/blacklisted in national database",
      });
    }

    let level: RiskLevel = "LOW";
    if (score >= 80) level = "CRITICAL";
    else if (score >= 50) level = "HIGH";
    else if (score >= 25) level = "MEDIUM";

    entity.riskScore = score;
    await entity.save();

    await RiskAssessmentModel.create({
      entityId,
      score,
      level,
      factors,
    });

    return { score, level, factors };
  }

  /**
   * Automated Relationship Discovery Engine
   */
  private static async evaluateAutoRelationships(entityId: string): Promise<void> {
    try {
      // Auto-rule: Check if device appears in multiple cases
      const caseLinks = await RelationshipModel.find({
        sourceEntityId: entityId,
        relationshipType: "DEVICE_LINKED_TO_CASE",
      });
      if (caseLinks.length >= 2) {
        await this.recordEvent(entityId, "CASE_CLUSTER_DETECTED", "rules-engine", {
          caseCount: caseLinks.length,
        }, "warning");
      }
    } catch (err: any) {
      logger.warn(`[RulesEngine] Auto-relationship error: ${err.message}`);
    }
  }

  /**
   * Helper to record intelligence event
   */
  public static async recordEvent(
    entityId: string,
    eventType: string,
    source: string,
    payload: Record<string, any>,
    severity: "info" | "warning" | "error" | "critical" = "info"
  ): Promise<void> {
    await IntelligenceEventModel.create({
      entityId,
      eventType,
      source,
      payload,
      timestamp: new Date(),
      severity,
    });
  }
}
