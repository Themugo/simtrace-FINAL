import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authRateLimiter, bruteForceProtection } from "../middleware/security.middleware.js";

const router = Router();

router.post("/login", authRateLimiter, bruteForceProtection, AuthController.login);
router.get("/me", authenticate, AuthController.me);

export default router;
