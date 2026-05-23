import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { Device, Ping, Alert, TheftReport, Payment } from '../db/index.js';
import { computeRiskScore } from '../services/intelligence.js';
import {
  generateImeiReport,
  triageAlerts,
  explainAlert,
  securityChat,
} from '../services/ai.js';
import { PLANS, getUserSubscription } from '../services/billing.js';

const router = Router();

// ── AI quota enforcement ──────────────────────────────────────────────────────
async function checkAiQuota(userId: string) {
  const sub = await getUserSubscription(userId);
  const plan = PLANS.find(p => p.id === sub.plan) || PLANS[0];

  if (!plan.aiReportsPerMonth) return { allowed: true, used: 0, limit: 0 };

  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const used = await Payment.countDocuments({
    user: userId,
    type: 'api_call',
    description: { $regex: /^ai_call/ },
    createdAt: { $gte: since },
  });

  return { allowed: used < plan.aiReportsPerMonth, used, limit: plan.aiReportsPerMonth, plan: plan.id };
}

async function recordAiCall(userId: string, callType: string): Promise<void> {
  if (!userId) return;
  await Payment.create({
    user: userId,
    type: 'api_call',
    amountKES: 0,
    method: 'free',
    status: 'completed',
    description: `ai_call:${callType}`,
    paidAt: new Date(),
  });
}

// ── POST /api/ai/imei-report ──────────────────────────────────────────────────
router.post('/imei-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { imei } = z.object({ imei: z.string().min(15).max(17) }).parse(req.body);

    let userId: string | null = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { id: string };
        userId = payload.id;
      } catch { /* anonymous — still allow 1 check */ }
    }

    if (userId) {
      const quota = await checkAiQuota(userId);
      if (!quota.allowed) {
        return res.status(429).json({
          error: `AI report quota reached (${quota.used}/${quota.limit} this month). Upgrade to Pro for 50/month.`,
          code: 'AI_QUOTA_EXCEEDED',
          plan: quota.plan,
        });
      }
    }

    const [device, recentPings, alerts, reports, riskScore] = await Promise.all([
      Device.findOne({ imei }),
      Ping.find({ imei, ts: { $gte: new Date(Date.now() - 24 * 3600000) } }).sort({ ts: -1 }).limit(20),
      Alert.find({ imei }).sort({ ts: -1 }).limit(10),
      TheftReport.find({ imei }).sort({ createdAt: -1 }).limit(5),
      computeRiskScore(imei),
    ]);

    const report = await generateImeiReport({ imei, device, riskScore, recentPings, alerts, reports });

    if (userId) await recordAiCall(userId, 'imei_report');

    res.json({ report, riskScore });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── POST /api/ai/triage ── admin only ─────────────────────────────────────────
router.post('/triage', authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.body?.limit) || 20, 50);
    const alerts = await Alert.find({ read: false }).sort({ ts: -1 }).limit(limit);
    if (!alerts.length) return res.json({ triage: [] });

    const triage = await triageAlerts(alerts);
    res.json({ triage, count: alerts.length });
  } catch (err) { next(err); }
});

// ── POST /api/ai/explain-alert ────────────────────────────────────────────────
router.post('/explain-alert', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alertId } = z.object({ alertId: z.string() }).parse(req.body);

    const quota = await checkAiQuota(req.user!.id);
    if (!quota.allowed && req.user!.role !== 'admin') {
      return res.status(429).json({
        error: `AI quota reached (${quota.used}/${quota.limit}/month). Upgrade to Pro.`,
        code: 'AI_QUOTA_EXCEEDED',
      });
    }

    const alert = await Alert.findById(alertId);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const explanation = await explainAlert(alert);
    await recordAiCall(req.user!.id, 'explain_alert');

    res.json({ explanation });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      })).min(1).max(40),
    });
    const { messages } = schema.parse(req.body);

    let userContext: any = null;
    let userId: string | null = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { id: string; role: string };
        userId = payload.id;

        if (payload.role === 'user') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const chatCount = await Payment.countDocuments({
            user: userId,
            description: 'ai_call:chat',
            createdAt: { $gte: today },
          });
          const sub = await getUserSubscription(userId);
          const plan = PLANS.find(p => p.id === sub.plan) || PLANS[0];
          const dailyLimit = plan.aiReportsPerMonth > 0 ? 10 : 50;

          if (chatCount >= dailyLimit) {
            return res.status(429).json({
              error: `Daily AI chat limit reached (${chatCount}/${dailyLimit}). Resets midnight.`,
              code: 'AI_QUOTA_EXCEEDED',
            });
          }
        }

        const [deviceCount, alertCount] = await Promise.all([
          Device.countDocuments({ owner: userId }),
          Alert.countDocuments({ read: false }),
        ]);
        userContext = { role: payload.role, deviceCount, alertCount };
      } catch { /* unauthenticated */ }
    }

    const reply = await securityChat({ messages, userContext });
    if (userId) await recordAiCall(userId, 'chat');

    res.json({ reply });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── POST /api/ai/chat/stream ───────────────────────────────────────────────────
router.post('/chat/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages } = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(4000),
      })).min(1).max(40),
    }).parse(req.body);

    let userId: string | null = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as { id: string; role: string };
        userId = payload.id;

        if (payload.role === 'user') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const chatCount = await Payment.countDocuments({
            user: userId,
            description: 'ai_call:chat',
            createdAt: { $gte: today },
          });
          const sub = await getUserSubscription(userId);
          const plan = PLANS.find(p => p.id === sub.plan) || PLANS[0];
          const dailyLimit = plan.aiReportsPerMonth > 0 ? 50 : 10;
          if (chatCount >= dailyLimit) {
            return res.status(429).json({ error: 'Daily AI chat limit reached' });
          }
        }
      } catch { /* unauthenticated */ }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'AI not configured' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        stream: true,
        system: 'You are SimTrace\'s AI security assistant. Help users understand device security, IMEI checks, SIM swap attacks and SimTrace features. Be helpful, concise, and action-oriented.',
        messages,
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      return res.end();
    }

    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') continue;
        try {
          const evt = JSON.parse(json);
          if (evt.type === 'content_block_delta' && evt.delta?.text) {
            fullText += evt.delta.text;
            res.write(`data: ${JSON.stringify({ delta: evt.delta.text })}\n\n`);
          }
          if (evt.type === 'message_stop') {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          }
        } catch { /* skip malformed chunks */ }
      }
    }

    if (userId) await recordAiCall(userId, 'chat');
    res.end();
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    if (!res.headersSent) next(err);
    else res.end();
  }
});

export default router;
