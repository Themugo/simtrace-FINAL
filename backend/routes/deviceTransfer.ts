// routes/deviceTransfer.ts - Device transfer API endpoints
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireSelfOrAdmin, requireRecordOwner, requireDeviceOwner, requireRole } from "../middleware/auth.js";
import { DeviceTransfer } from "../db/index.js";
import {
  initiateDeviceTransfer,
  acceptDeviceTransfer,
  confirmDeviceTransfer,
  cancelDeviceTransfer,
  raiseDispute,
  resolveDispute,
  getDeviceTransfer,
  getDeviceTransfersByDevice,
  getDeviceTransfersByUser,
  getPendingTransfers,
  getDisputedTransfers,
} from "../services/deviceTransfer.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// ── Device Transfer Management ───────────────────────────────────────────────────────
router.post("/", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      fromUserId: z.string(),
      toUserId: z.string(),
      transferType: z.enum(["gift", "sale", "inheritance"]),
      transferDate: z.date(),
      salePrice: z.number().optional(),
      currency: z.string().optional(),
      paymentMethod: z.string().optional(),
      paymentReference: z.string().optional(),
      termsAccepted: z.boolean(),
    });

    const data = schema.parse(req.body);
    const transfer = await initiateDeviceTransfer({ ...data, createdBy: req.user!.id });
    res.status(201).json(transfer);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:transferId/accept", authenticate, requireRecordOwner({ model: DeviceTransfer, idParam: "transferId", ownerFields: ["userId", "toUserId"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transferId } = req.params;
    const transfer = await acceptDeviceTransfer(transferId as string, req.user!.id);
    res.json(transfer);
  } catch (err) { next(err); }
});

router.post("/:transferId/confirm", authenticate, requireRecordOwner({ model: DeviceTransfer, idParam: "transferId", ownerFields: ["userId", "toUserId"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transferId } = req.params;
    const transfer = await confirmDeviceTransfer(transferId as string, req.user!.id);
    res.json(transfer);
  } catch (err) { next(err); }
});

router.post("/:transferId/cancel", authenticate, requireRecordOwner({ model: DeviceTransfer, idParam: "transferId", ownerFields: ["userId", "toUserId"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { transferId } = req.params;
    const data = schema.parse(req.body);
    const transfer = await cancelDeviceTransfer(transferId as string, req.user!.id, data.reason);
    res.json(transfer);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:transferId/dispute", authenticate, requireRecordOwner({ model: DeviceTransfer, idParam: "transferId", ownerFields: ["userId", "toUserId"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { transferId } = req.params;
    const data = schema.parse(req.body);
    const transfer = await raiseDispute(transferId as string, req.user!.id, data.reason);
    res.json(transfer);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.post("/:transferId/resolve", authenticate, requireRole("admin", "super_admin"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      resolution: z.string(),
    });

    const { transferId } = req.params;
    const data = schema.parse(req.body);
    const transfer = await resolveDispute(transferId as string, data.resolution, req.user!.id);
    res.json(transfer);
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as any).errors });
    next(err);
  }
});

router.get("/:transferId", authenticate, requireRecordOwner({ model: DeviceTransfer, idParam: "transferId", ownerFields: ["userId", "toUserId"] }), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transferId } = req.params;
    const transfer = await getDeviceTransfer(transferId as string);
    res.json(transfer);
  } catch (err) { next(err); }
});

router.get("/device/:deviceId", authenticate, requireDeviceOwner("deviceId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId } = req.params;
    const transfers = await getDeviceTransfersByDevice(deviceId as string);
    res.json({ transfers, count: transfers.length });
  } catch (err) { next(err); }
});

router.get("/user/:userId", authenticate, requireSelfOrAdmin("userId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const transfers = await getDeviceTransfersByUser(userId as string);
    res.json({ transfers, count: transfers.length });
  } catch (err) { next(err); }
});

router.get("/pending/:userId", authenticate, requireSelfOrAdmin("userId"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const transfers = await getPendingTransfers(userId as string);
    res.json({ transfers, count: transfers.length });
  } catch (err) { next(err); }
});

router.get("/disputed", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const transfers = await getDisputedTransfers();
    res.json({ transfers, count: transfers.length });
  } catch (err) { next(err); }
});

export default router;
