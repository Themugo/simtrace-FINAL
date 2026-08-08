import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { Device } from "../db/index.js";

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Inline device command schema
const commandSchema = new mongoose.Schema({
  device:    { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true, index: true },
  imei:      { type: String, required: true, index: true },
  command:   { type: String, enum: ["lock", "unlock", "wipe", "ring"], required: true },
  issuedBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status:    { type: String, enum: ["pending", "acknowledged", "executed", "failed"], default: "pending" },
  issuedAt:  { type: Date, default: Date.now },
  executedAt: Date,
});
const DeviceCommand = (mongoose.models.DeviceCommand || mongoose.model("DeviceCommand", commandSchema)) as mongoose.Model<any>;

// POST /api/devices/:id/lock
router.post("/:id/lock", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const device = await Device.findOne({ _id: req.params.id, owner: req.user!.id });
    if (!device) return res.status(404).json({ error: "Device not found or not yours" });

    // Cancel any pending lock/unlock commands for this device
    await DeviceCommand.updateMany(
      { device: device._id, status: "pending" },
      { status: "failed" }
    );

    const cmd = await DeviceCommand.create({
      device:   device._id,
      imei:     device.imei,
      command:  "lock",
      issuedBy: req.user!.id,
    });

    res.json({ message: "Lock command queued. Device will lock on next agent check-in.", commandId: cmd._id });
  } catch (err) { next(err); }
});

// POST /api/devices/:id/unlock
router.post("/:id/unlock", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const device = await Device.findOne({ _id: req.params.id, owner: req.user!.id });
    if (!device) return res.status(404).json({ error: "Device not found" });

    await DeviceCommand.create({ device: device._id, imei: device.imei, command: "unlock", issuedBy: req.user!.id });
    res.json({ message: "Unlock command queued." });
  } catch (err) { next(err); }
});

// GET /api/devices/:id/commands — polled by mobile agent (authenticated by device key)
// The agent passes X-Device-Key and gets pending commands
router.get("/:id/commands", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceKey = req.headers["x-device-key"] as string;
    if (!deviceKey) return res.status(401).json({ error: "X-Device-Key required" });

    const device = await Device.findOne({ _id: req.params.id, deviceKey });
    if (!device) return res.status(401).json({ error: "Invalid device key" });

    const commands = await DeviceCommand.find({ device: device._id, status: "pending" })
      .sort({ issuedAt: 1 }).lean();

    res.json({ commands });
  } catch (err) { next(err); }
});

// PATCH /api/devices/:id/commands/:cmdId — agent acknowledges execution
router.patch("/:id/commands/:cmdId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceKey = req.headers["x-device-key"] as string;
    const device = await Device.findOne({ _id: req.params.id, deviceKey });
    if (!device) return res.status(401).json({ error: "Invalid device key" });

    const { status } = req.body;
    await DeviceCommand.findByIdAndUpdate(req.params.cmdId, {
      status:     status || "executed",
      executedAt: new Date(),
    });
    res.json({ message: "Command status updated" });
  } catch (err) { next(err); }
});

export default router;
