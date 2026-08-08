import { Request, Response, NextFunction } from "express";
import { IntelligenceGraphService } from "../services/intelligenceGraph.service.js";
import { EntityModel } from "../models/entity.model.js";
import { RelationshipModel } from "../models/relationship.model.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

function maskSensitive(value: string, role?: string): string {
  if (role === "admin" || role === "investigator" || role === "police") {
    return value;
  }
  if (!value || value.length < 6) return "*****";
  return value.substring(0, 5) + "****" + value.substring(value.length - 2);
}

export class IntelligenceController {
  /**
   * Universal Search (IMEI, Phone, SIM, Person, Case)
   */
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, type } = req.query as { query?: string; type?: string };
      if (!query) {
        throw AppError.badRequest("Search query param 'query' is required");
      }

      const userRole = (req as any).user?.role || "user";
      const filter: any = {
        $or: [
          { externalId: { $regex: query, $options: "i" } },
          { name: { $regex: query, $options: "i" } },
        ],
      };

      if (type) {
        filter.entityType = type.toUpperCase();
      }

      const entities = await EntityModel.find(filter).limit(20);

      const results = entities.map((entity) => {
        const obj = entity.toObject();
        if (entity.entityType === "PHONE_NUMBER" || entity.entityType === "PERSON") {
          obj.name = maskSensitive(obj.name, userRole);
          obj.externalId = maskSensitive(obj.externalId, userRole);
        }
        return obj;
      });

      sendSuccess(res, { query, results, count: results.length }, "Intelligence search results");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Entity Timeline
   */
  static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const timeline = await IntelligenceGraphService.getEntityTimeline(id);
      sendSuccess(res, { entityId: id, events: timeline }, "Entity timeline retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Graph Visualization (React Flow / D3 nodes & edges)
   */
  static async getGraphVisualization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityId } = req.params;
      const { entity, directConnections, secondaryConnections } = await IntelligenceGraphService.findConnections(entityId);

      const nodesMap = new Map<string, any>();
      const edges: any[] = [];

      nodesMap.set(entity._id.toString(), {
        id: entity._id.toString(),
        type: entity.entityType,
        label: entity.name,
        externalId: entity.externalId,
        riskScore: entity.riskScore,
        isRoot: true,
      });

      directConnections.forEach(({ relationship, entity: child }) => {
        const childId = child._id.toString();
        if (!nodesMap.has(childId)) {
          nodesMap.set(childId, {
            id: childId,
            type: child.entityType,
            label: child.name,
            externalId: child.externalId,
            riskScore: child.riskScore,
            isRoot: false,
          });
        }
        edges.push({
          id: `edge_${relationship._id}`,
          source: relationship.sourceEntityId,
          target: relationship.targetEntityId,
          relationship: relationship.relationshipType,
          confidence: relationship.confidenceScore,
        });
      });

      secondaryConnections.forEach(({ relationship, entity: child }) => {
        const childId = child._id.toString();
        if (!nodesMap.has(childId)) {
          nodesMap.set(childId, {
            id: childId,
            type: child.entityType,
            label: child.name,
            externalId: child.externalId,
            riskScore: child.riskScore,
            isSecondary: true,
          });
        }
        edges.push({
          id: `edge_${relationship._id}`,
          source: relationship.sourceEntityId,
          target: relationship.targetEntityId,
          relationship: relationship.relationshipType,
          confidence: relationship.confidenceScore,
        });
      });

      sendSuccess(
        res,
        {
          rootEntityId: entityId,
          nodes: Array.from(nodesMap.values()),
          edges,
        },
        "Graph visualization payload generated"
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create entity
   */
  static async createEntity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entity = await IntelligenceGraphService.createEntity(req.body);
      sendSuccess(res, { entity }, "Graph entity created/updated", 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create relationship
   */
  static async createRelationship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const relationship = await IntelligenceGraphService.createRelationship(req.body);
      sendSuccess(res, { relationship }, "Graph relationship established", 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Calculate risk assessment
   */
  static async calculateRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityId } = req.params;
      const risk = await IntelligenceGraphService.calculateRiskScore(entityId);
      sendSuccess(res, risk, "Risk assessment calculated successfully");
    } catch (err) {
      next(err);
    }
  }
}
