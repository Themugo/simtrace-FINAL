import { Router } from "express";
import { IntelligenceController } from "../controllers/intelligence.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/search", IntelligenceController.search);
router.get("/entity/:id/timeline", IntelligenceController.getTimeline);
router.get("/graph/:entityId", IntelligenceController.getGraphVisualization);
router.get("/risk/:entityId", IntelligenceController.calculateRisk);

router.post("/entity", authenticate, IntelligenceController.createEntity);
router.post("/relationship", authenticate, IntelligenceController.createRelationship);

export default router;
