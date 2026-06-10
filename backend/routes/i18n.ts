// routes/i18n.ts - API endpoints for multi-language support
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { multiLanguageService } from "../services/i18n/multiLanguage.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Languages ────────────────────────────────────────────────────────────────────

router.get("/languages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const languages = multiLanguageService.getLanguages();
    res.json({ languages });
  } catch (err) {
    next(err);
  }
});

router.get("/languages/:code", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const language = multiLanguageService.getLanguage(code as string);
    
    if (!language) {
      return res.status(404).json({ error: "Language not found" });
    }

    res.json({ language });
  } catch (err) {
    next(err);
  }
});

router.post("/languages/:code/activate", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const success = multiLanguageService.activateLanguage(code as string);
    
    if (!success) {
      return res.status(404).json({ error: "Language not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.post("/languages/:code/deactivate", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const success = multiLanguageService.deactivateLanguage(code as string);
    
    if (!success) {
      return res.status(404).json({ error: "Language not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

// ── Translations ────────────────────────────────────────────────────────────────

router.post("/translations", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      languageCode: z.string(),
      key: z.string(),
      value: z.string(),
      context: z.string().optional()
    });
    const data = schema.parse(req.body);

    const translation = multiLanguageService.addTranslation(data.languageCode, data.key, data.value, data.context);
    res.json({ translation });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/translations/:languageCode/:key", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { languageCode, key } = req.params;
    const translation = multiLanguageService.getTranslation(languageCode as string, key as string);
    
    if (!translation) {
      return res.status(404).json({ error: "Translation not found" });
    }

    res.json({ translation });
  } catch (err) {
    next(err);
  }
});

router.get("/translations/:languageCode", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { languageCode } = req.params;
    const translations = multiLanguageService.getTranslationsForLanguage(languageCode as string);
    res.json({ translations });
  } catch (err) {
    next(err);
  }
});

router.put("/translations/:languageCode/:key", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { languageCode, key } = req.params;
    const schema = z.object({
      value: z.string(),
      context: z.string().optional()
    });
    const data = schema.parse(req.body);

    const translation = multiLanguageService.updateTranslation(languageCode as string, key as string, data.value, data.context);
    
    if (!translation) {
      return res.status(404).json({ error: "Translation not found" });
    }

    res.json({ translation });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.delete("/translations/:languageCode/:key", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { languageCode, key } = req.params;
    const success = multiLanguageService.deleteTranslation(languageCode as string, key as string);
    
    if (!success) {
      return res.status(404).json({ error: "Translation not found" });
    }

    res.json({ success });
  } catch (err) {
    next(err);
  }
});

router.get("/translations/export/:languageCode", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { languageCode } = req.params;
    const exported = multiLanguageService.exportTranslations(typeof languageCode === 'string' ? languageCode : languageCode[0]);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${typeof languageCode === 'string' ? languageCode : languageCode[0]}-translations.json"`);
    res.send(exported);
  } catch (err) {
    next(err);
  }
});

router.post("/translations/import", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      translations: z.array(z.object({
        translationId: z.string(),
        languageCode: z.string(),
        key: z.string(),
        value: z.string(),
        context: z.string().optional(),
        updatedAt: z.number()
      }))
    });
    const { translations } = schema.parse(req.body);

    const imported = multiLanguageService.importTranslations(translations);
    res.json({ imported });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

// ── User Preferences ─────────────────────────────────────────────────────────────

router.post("/preferences/language", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      languageCode: z.string()
    });
    const { languageCode } = schema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const preference = multiLanguageService.setUserLanguage(userId, languageCode);
    res.json({ preference });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/preferences/language", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const languageCode = multiLanguageService.getUserLanguage(userId);
    res.json({ languageCode });
  } catch (err) {
    next(err);
  }
});

router.get("/preferences/translations", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const translations = multiLanguageService.getUserTranslations(userId);
    res.json({ translations });
  } catch (err) {
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────

router.get("/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statistics = multiLanguageService.getStatistics();
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

export default router;
