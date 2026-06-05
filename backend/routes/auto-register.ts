import { Router, Request, Response, NextFunction } from "express";
import { Device, Subscription } from "../db/index.js";
import { authenticate } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

// POST /api/devices/auto-register - Auto-register device with scanned data
router.post(
  "/auto-register",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceInfo } = z
        .object({
          deviceInfo: z.object({
            imei: z.string(),
            imei2: z.string().optional(),
            serialNumber: z.string(),
            model: z.string(),
            brand: z.string(),
            osVersion: z.string(),
            platform: z.string(),
            macAddress: z.string().optional(),
            deviceDna: z.string(),
            screenResolution: z.string(),
            totalStorage: z.number(),
            availableStorage: z.number(),
            cpuInfo: z.string(),
          }),
        })
        .parse(req.body);

      const userId = (req as any).user.id;

      // Check if device already exists
      const existingDevice = await Device.findOne({
        $or: [{ imei: deviceInfo.imei }, { deviceDna: deviceInfo.deviceDna }],
      });

      if (existingDevice) {
        return res.status(409).json({
          error: "Device already registered",
          device: existingDevice,
        });
      }

      // Create device with scanned information
      const device = await Device.create({
        owner: userId,
        imei: deviceInfo.imei,
        imei2: deviceInfo.imei2,
        serialNumber: deviceInfo.serialNumber,
        model: deviceInfo.model,
        brand: deviceInfo.brand,
        osVersion: deviceInfo.osVersion,
        platform: deviceInfo.platform,
        macAddress: deviceInfo.macAddress,
        deviceDna: deviceInfo.deviceDna,
        screenResolution: deviceInfo.screenResolution,
        totalStorage: deviceInfo.totalStorage,
        availableStorage: deviceInfo.availableStorage,
        cpuInfo: deviceInfo.cpuInfo,
        nickname: `${deviceInfo.brand} ${deviceInfo.model}`,
        status: "active",
        trackingEnabled: true,
      });

      res.json({
        message: "Device registered successfully",
        device,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "ZodError") {
        return res.status(400).json({ error: (err as any).errors });
      }
      next(err);
    }
  }
);

export default router;
