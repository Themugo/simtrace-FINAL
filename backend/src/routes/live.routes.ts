import { Router } from "express";
import { LiveOperationsController } from "../controllers/live.controller.js";

const router = Router();

router.get("/status", LiveOperationsController.getStatus);
router.get("/events", LiveOperationsController.getEvents);
router.get("/connections", LiveOperationsController.getConnections);

export default router;
