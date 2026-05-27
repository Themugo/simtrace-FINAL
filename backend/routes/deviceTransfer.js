// routes/deviceTransfer.js - Device transfer API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
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

// ── Device Transfer Management ───────────────────────────────────────────────────────
router.post("/", authenticate, async (req, res, next) => {
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
    const transfer = await initiateDeviceTransfer({ ...data, createdBy: req.user.id });
    res.status(201).json(transfer);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/:transferId/accept", authenticate, async (req, res, next) => {
  try {
    const { transferId } = req.params;
    const transfer = await acceptDeviceTransfer(transferId, req.user.id);
    res.json(transfer);
  } catch (err) { next(err); }
});

router.post("/:transferId/confirm", authenticate, async (req, res, next) => {
  try {
    const { transferId } = req.params;
    const transfer = await confirmDeviceTransfer(transferId, req.user.id);
    res.json(transfer);
  } catch (err) { next(err); }
});

router.post("/:transferId/cancel", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { transferId } = req.params;
    const data = schema.parse(req.body);
    const transfer = await cancelDeviceTransfer(transferId, req.user.id, data.reason);
    res.json(transfer);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/:transferId/dispute", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { transferId } = req.params;
    const data = schema.parse(req.body);
    const transfer = await raiseDispute(transferId, req.user.id, data.reason);
    res.json(transfer);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/:transferId/resolve", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      resolution: z.string(),
    });

    const { transferId } = req.params;
    const data = schema.parse(req.body);
    const transfer = await resolveDispute(transferId, data.resolution, req.user.id);
    res.json(transfer);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/:transferId", authenticate, async (req, res, next) => {
  try {
    const { transferId } = req.params;
    const transfer = await getDeviceTransfer(transferId);
    res.json(transfer);
  } catch (err) { next(err); }
});

router.get("/device/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const transfers = await getDeviceTransfersByDevice(deviceId);
    res.json({ transfers, count: transfers.length });
  } catch (err) { next(err); }
});

router.get("/user/:userId", authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const transfers = await getDeviceTransfersByUser(userId);
    res.json({ transfers, count: transfers.length });
  } catch (err) { next(err); }
});

router.get("/pending/:userId", authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const transfers = await getPendingTransfers(userId);
    res.json({ transfers, count: transfers.length });
  } catch (err) { next(err); }
});

router.get("/disputed", authenticate, async (req, res, next) => {
  try {
    const transfers = await getDisputedTransfers();
    res.json({ transfers, count: transfers.length });
  } catch (err) { next(err); }
});

export default router;
