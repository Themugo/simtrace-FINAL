import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createAppExtension,
  installAppExtension,
  addAppReview,
  createAppWorkflow,
  executeAppWorkflow,
  createAppDashboard,
  getMarketplaceStatistics,
  enterpriseMarketplace,
} from "../marketplace/marketplace.js";

// Type definitions for marketplace entities
interface AppExtension {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'plugin' | 'integration' | 'workflow' | 'dashboard';
  category: string;
  author: string;
  icon?: string;
  screenshots: string[];
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
    currency?: string;
    trialDays?: number;
  };
  features: string[];
  requirements: {
    apiVersion: string;
    permissions: string[];
  };
  status: 'draft' | 'published' | 'deprecated' | 'removed';
  downloads: number;
  rating: number;
  reviews: number;
  publishedAt?: Date;
  updatedAt: Date;
}

interface AppDashboard {
  id: string;
  extensionId: string;
  name: string;
  description: string;
  layout: {
    type: 'grid' | 'tabs' | 'custom';
    columns: number;
  };
  widgets: Array<{
    id: string;
    type: 'chart' | 'metric' | 'table' | 'map' | 'list';
    title: string;
    config: Record<string, any>;
    position: {
      x: number;
      y: number;
      w: number;
      h: number;
    };
  }>;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

// GET /api/marketplace/extensions — list all published extensions
router.get("/extensions", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, category, search } = req.query;

    let extensions;
    if (search && typeof search === 'string') {
      extensions = enterpriseMarketplace.searchExtensions(search);
    } else if (type && typeof type === 'string') {
      extensions = enterpriseMarketplace.getExtensionsByType(type as any);
    } else if (category && typeof category === 'string') {
      extensions = enterpriseMarketplace.getExtensionsByCategory(category);
    } else {
      extensions = Array.from((enterpriseMarketplace as any).extensions.values())
        .filter((e: any) => e.status === 'published');
    }

    res.json({ extensions });
  } catch (err) { next(err); }
});

// GET /api/marketplace/extensions/:id — get extension details
router.get("/extensions/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const extension = enterpriseMarketplace.getExtension(req.params.id as string);
    if (!extension) {
      return res.status(404).json({ error: "Extension not found" });
    }
    res.json(extension);
  } catch (err) { next(err); }
});

// POST /api/marketplace/extensions — create extension (admin only)
router.post("/extensions", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      name: z.string(),
      description: z.string(),
      version: z.string(),
      type: z.enum(['plugin', 'integration', 'workflow', 'dashboard']),
      category: z.string(),
      author: z.string(),
      icon: z.string().optional(),
      screenshots: z.array(z.string()),
      pricing: z.object({
        type: z.enum(['free', 'paid', 'freemium']),
        price: z.number().optional(),
        currency: z.string().optional(),
        trialDays: z.number().optional(),
      }),
      features: z.array(z.string()),
      requirements: z.object({
        apiVersion: z.string(),
        permissions: z.array(z.string()),
      }),
      status: z.enum(['draft', 'published', 'deprecated', 'removed']),
    });
    const data = schema.parse(req.body);

    const extension = createAppExtension({
      ...data,
      publishedAt: data.status === 'published' ? new Date() : undefined,
    } as Omit<AppExtension, 'id' | 'downloads' | 'rating' | 'reviews' | 'updatedAt'>);

    res.status(201).json(extension);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/marketplace/install — install extension
router.post("/install", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      extensionId: z.string(),
      config: z.record(z.any()).optional(),
    });
    const { extensionId, config } = schema.parse(req.body);

    const organizationId = req.user!.organizationId || req.user!.id;
    const installation = installAppExtension(organizationId, extensionId, config);

    res.status(201).json(installation);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/marketplace/installations — get user's installations
router.get("/installations", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.user!.organizationId || req.user!.id;
    const installations = enterpriseMarketplace.getInstallationsByOrganization(organizationId);
    res.json({ installations });
  } catch (err) { next(err); }
});

// DELETE /api/marketplace/installations/:id — uninstall extension
router.delete("/installations/:id", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const success = enterpriseMarketplace.uninstallExtension(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Installation not found" });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/marketplace/reviews — add review
router.post("/reviews", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      extensionId: z.string(),
      rating: z.number().min(1).max(5),
      title: z.string(),
      content: z.string(),
    });
    const data = schema.parse(req.body);

    const organizationId = req.user!.organizationId || req.user!.id;
    const review = addAppReview({
      ...data,
      organizationId,
      userId: req.user!.id,
    });

    res.status(201).json(review);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/marketplace/reviews/:extensionId — get reviews for extension
router.get("/reviews/:extensionId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = enterpriseMarketplace.getReviewsByExtension(req.params.extensionId as string);
    res.json({ reviews });
  } catch (err) { next(err); }
});

// POST /api/marketplace/workflows — create workflow
router.post("/workflows", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      extensionId: z.string(),
      name: z.string(),
      description: z.string(),
      triggers: z.array(z.object({
        id: z.string(),
        type: z.enum(['event', 'schedule', 'manual']),
        config: z.record(z.any()),
      })),
      steps: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['action', 'condition', 'delay', 'notification']),
        config: z.record(z.any()),
        order: z.number(),
      })),
      status: z.enum(['active', 'inactive', 'error']),
    });
    const data = schema.parse(req.body);

    const workflow = createAppWorkflow(data);
    res.status(201).json(workflow);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// POST /api/marketplace/workflows/:id/execute — execute workflow
router.post("/workflows/:id/execute", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workflow = await executeAppWorkflow(req.params.id);
    res.json(workflow);
  } catch (err) { next(err); }
});

// POST /api/marketplace/dashboards — create dashboard
router.post("/dashboards", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      extensionId: z.string(),
      name: z.string(),
      description: z.string(),
      layout: z.object({
        type: z.enum(['grid', 'tabs', 'custom']),
        columns: z.number(),
      }),
      widgets: z.array(z.object({
        id: z.string(),
        type: z.enum(['chart', 'metric', 'table', 'map', 'list']),
        title: z.string(),
        config: z.record(z.any()),
        position: z.object({
          x: z.number(),
          y: z.number(),
          w: z.number(),
          h: z.number(),
        }),
      })),
      isPublic: z.boolean(),
    });
    const data = schema.parse(req.body);

    const dashboard = createAppDashboard(data as Omit<AppDashboard, 'id' | 'createdAt' | 'updatedAt'>);
    res.status(201).json(dashboard);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// GET /api/marketplace/dashboards — get public dashboards
router.get("/dashboards", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const dashboards = enterpriseMarketplace.getPublicDashboards();
    res.json({ dashboards });
  } catch (err) { next(err); }
});

// GET /api/marketplace/statistics — get marketplace statistics (admin only)
router.get("/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = getMarketplaceStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
