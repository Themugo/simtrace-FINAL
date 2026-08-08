import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import liveRoutes from "./live.routes.js";
import intelligenceRoutes from "./intelligence.routes.js";
import aiRoutes from "./ai.routes.js";

const apiRouter = Router();

apiRouter.use("/", healthRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/live", liveRoutes);
apiRouter.use("/intelligence", intelligenceRoutes);
apiRouter.use("/ai", aiRoutes);

export default apiRouter;
