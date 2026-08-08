import { EntityModel } from "../../models/entity.model.js";
import { RelationshipModel } from "../../models/relationship.model.js";
import { IntelligenceEventModel } from "../../models/intelligenceEvent.model.js";
import { AppError } from "../../utils/AppError.js";

export interface EntityFeatureSet {
  entityId: string;
  entityType: string;
  deviceAgeDays: number;
  simChangesCount: number;
  locationsCount: number;
  blacklistStatus: boolean;
  caseCount: number;
  activityFrequency: number;
  networkConnectionsCount: number;
  impossibleTravelDetected: boolean;
  highRiskNodeConnection: boolean;
}

export class FeatureExtractorService {
  public static async extractFeatures(entityId: string): Promise<EntityFeatureSet> {
    const entity = await EntityModel.findById(entityId);
    if (!entity) {
      throw AppError.notFound(`Entity ${entityId} not found`);
    }

    // 1. Calculate device age in days
    const createdDate = new Date(entity.createdAt || Date.now());
    const deviceAgeDays = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));

    // 2. Count SIM changes (DEVICE_USED_SIM)
    const simRels = await RelationshipModel.find({
      sourceEntityId: entityId,
      relationshipType: "DEVICE_USED_SIM",
    });
    const simChangesCount = simRels.length;

    // 3. Count Locations (DEVICE_LOCATED_AT)
    const locRels = await RelationshipModel.find({
      sourceEntityId: entityId,
      relationshipType: "DEVICE_LOCATED_AT",
    });
    const locationsCount = locRels.length;

    // 4. Blacklist status
    const blacklistStatus = entity.status === "blacklisted" || entity.status === "stolen";

    // 5. Case Count
    const caseRels = await RelationshipModel.find({
      sourceEntityId: entityId,
      relationshipType: "DEVICE_LINKED_TO_CASE",
    });
    const caseCount = caseRels.length;

    // 6. Activity Frequency (events count in past 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activityCount = await IntelligenceEventModel.countDocuments({
      entityId,
      timestamp: { $gte: sevenDaysAgo },
    });

    // 7. Network connections count (direct degrees)
    const totalOutbound = await RelationshipModel.countDocuments({ sourceEntityId: entityId });
    const totalInbound = await RelationshipModel.countDocuments({ targetEntityId: entityId });
    const networkConnectionsCount = totalOutbound + totalInbound;

    // 8. Spatial displacement check (Impossible travel rule signal)
    const locationEvents = await IntelligenceEventModel.find({
      entityId,
      eventType: "LOCATION_UPDATED",
    })
      .sort({ timestamp: -1 })
      .limit(2);

    let impossibleTravelDetected = false;
    if (locationEvents.length >= 2) {
      const p1 = locationEvents[0].payload;
      const p2 = locationEvents[1].payload;
      const t1 = new Date(locationEvents[0].timestamp).getTime();
      const t2 = new Date(locationEvents[1].timestamp).getTime();
      const timeDiffHours = Math.abs(t1 - t2) / (1000 * 60 * 60);

      if (p1.lat && p1.lng && p2.lat && p2.lng && timeDiffHours > 0) {
        // Approximate distance calculation in km
        const distKm = Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2)) * 111;
        const speedKmH = distKm / timeDiffHours;
        if (speedKmH > 800) {
          // Speed > 800 km/h indicates impossible travel
          impossibleTravelDetected = true;
        }
      }
    }

    // 9. High-risk node connectivity
    const connectedRels = await RelationshipModel.find({
      $or: [{ sourceEntityId: entityId }, { targetEntityId: entityId }],
    });

    const targetIds = connectedRels.map((r) => (r.sourceEntityId === entityId ? r.targetEntityId : r.sourceEntityId));
    const highRiskNodesCount = await EntityModel.countDocuments({
      _id: { $in: targetIds },
      $or: [{ status: "blacklisted" }, { status: "stolen" }, { riskScore: { $gte: 75 } }],
    });

    return {
      entityId,
      entityType: entity.entityType,
      deviceAgeDays,
      simChangesCount,
      locationsCount,
      blacklistStatus,
      caseCount,
      activityFrequency: activityCount,
      networkConnectionsCount,
      impossibleTravelDetected,
      highRiskNodeConnection: highRiskNodesCount > 0,
    };
  }
}
