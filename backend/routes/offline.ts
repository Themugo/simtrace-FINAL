// routes/offline.ts - API endpoints for offline capabilities
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { offlineSyncService } from "../services/offline/offlineSync.js";
import { offlineStorageService } from "../services/offline/offlineStorage.js";
import { offlineManager } from "../services/offline/offlineManager.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// ── Offline Sync ─────────────────────────────────────────────────────────────

router.post("/sync", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await offlineSyncService.sync(userId);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.get("/sync/pending", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const operations = offlineSyncService.getPendingOperations(userId);
    res.json({ operations });
  } catch (err) {
    next(err);
  }
});

router.get("/sync/failed", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const operations = offlineSyncService.getFailedOperations(userId);
    res.json({ operations });
  } catch (err) {
    next(err);
  }
});

router.post("/sync/retry", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await offlineSyncService.retryFailedOperations(userId);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.post("/sync/cancel", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    offlineSyncService.cancelSync();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── Offline Storage ───────────────────────────────────────────────────────────

router.post("/storage/store", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      entityType: z.enum(['device', 'location', 'alert', 'user', 'settings']),
      data: z.any(),
      ttl: z.number().optional()
    });
    const { deviceId, entityType, data, ttl } = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = offlineStorageService.store(deviceId, userId, entityType, data, ttl);
    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/storage/:dataId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dataId } = req.params;
    const data = offlineStorageService.retrieve(dataId);
    
    if (!data) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/storage/entity/:entityType", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entityType } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = offlineStorageService.retrieveByEntity(userId, entityType as any);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.put("/storage/:dataId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      data: z.any()
    });
    const { data } = schema.parse(req.body);
    const { dataId } = req.params;

    const result = offlineStorageService.update(dataId, data);
    
    if (!result) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/storage/:dataId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { dataId } = req.params;
    const success = offlineStorageService.delete(dataId);
    
    if (!success) {
      return res.status(404).json({ error: "Data not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.get("/storage/statistics", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const statistics = offlineStorageService.getStatistics(userId);
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

router.post("/storage/clear-expired", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cleared = offlineStorageService.clearExpired();
    res.json({ cleared });
  } catch (err) {
    next(err);
  }
});

// ── Offline Manager ───────────────────────────────────────────────────────────

router.get("/state", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const state = offlineManager.getOfflineState(userId);
    res.json({ state });
  } catch (err) {
    next(err);
  }
});

router.post("/sync-all", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await offlineManager.syncAll(userId);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.post("/retry-failed", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await offlineManager.retryFailed(userId);
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

router.post("/clear-old", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    offlineManager.clearOldData();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get("/export", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = offlineManager.exportOfflineData(userId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/import", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      queue: z.string(),
      storage: z.string()
    });
    const { queue, storage } = schema.parse(req.body);

    const result = offlineManager.importOfflineData(queue, storage);
    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

export default router;
