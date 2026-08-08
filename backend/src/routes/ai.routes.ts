import { Router } from "express";
import { AIController } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/risk/:entityId", AIController.getEntityRisk);
router.get("/alerts", AIController.getAlerts);
router.get("/recommendations", AIController.getRecommendations);

router.post("/alerts/:id/review", authenticate, AIController.reviewAlert);

export default router;
