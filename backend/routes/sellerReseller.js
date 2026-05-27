// routes/sellerReseller.js - Seller/Reseller API endpoints
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  createSellerReseller,
  getSellerReseller,
  getSellerResellerByEmail,
  updateSellerReseller,
  suspendSellerReseller,
  verifySellerReseller,
  getSellerResellersByCountry,
  getSellerResellersByRegion,
  registerDevice,
  getDeviceRegistration,
  getDeviceRegistrationsBySeller,
  getDeviceRegistrationsByDevice,
  getDeviceRegistrationsByCustomer,
  transferDeviceRegistration,
  cancelDeviceRegistration,
  checkSellerPermission,
  getSellerStatistics,
  getSellerResellerStatistics,
} from "../services/sellerReseller.js";

const router = Router();

// ── Seller/Reseller Management ───────────────────────────────────────────────────────
router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({
      businessName: z.string(),
      businessType: z.enum(["seller", "reseller", "both"]),
      officialEmail: z.string().email(),
      phoneNumber: z.string(),
      physicalAddress: z.string(),
      registrationNumber: z.string(),
      taxId: z.string(),
      licenseNumber: z.string(),
      countryCode: z.string(),
      region: z.string(),
      city: z.string(),
      officialEmailId: z.string(),
      securityOtpId: z.string(),
    });

    const data = schema.parse(req.body);
    const seller = await createSellerReseller({ ...data, createdBy: req.user.id });
    res.status(201).json(seller);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/:sellerId", authenticate, async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const seller = await getSellerReseller(sellerId);
    res.json(seller);
  } catch (err) { next(err); }
});

router.get("/email/:officialEmail", authenticate, async (req, res, next) => {
  try {
    const { officialEmail } = req.params;
    const seller = await getSellerResellerByEmail(officialEmail);
    res.json(seller);
  } catch (err) { next(err); }
});

router.patch("/:sellerId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const seller = await updateSellerReseller(sellerId, req.body, req.user.id);
    res.json(seller);
  } catch (err) { next(err); }
});

router.post("/:sellerId/suspend", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const seller = await suspendSellerReseller(sellerId, req.user.id);
    res.json(seller);
  } catch (err) { next(err); }
});

router.post("/:sellerId/verify", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const seller = await verifySellerReseller(sellerId, req.user.id);
    res.json(seller);
  } catch (err) { next(err); }
});

router.get("/country/:countryCode", authenticate, async (req, res, next) => {
  try {
    const { countryCode } = req.params;
    const sellers = await getSellerResellersByCountry(countryCode);
    res.json({ sellers, count: sellers.length });
  } catch (err) { next(err); }
});

router.get("/country/:countryCode/region/:region", authenticate, async (req, res, next) => {
  try {
    const { countryCode, region } = req.params;
    const sellers = await getSellerResellersByRegion(countryCode, region);
    res.json({ sellers, count: sellers.length });
  } catch (err) { next(err); }
});

// ── Device Registration ────────────────────────────────────────────────────────────────
router.post("/registrations", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      sellerId: z.string(),
      customerName: z.string(),
      customerEmail: z.string().email(),
      customerPhone: z.string(),
      saleDate: z.date(),
      salePrice: z.number(),
      imei: z.string(),
      deviceName: z.string(),
      deviceType: z.string(),
      warrantyStart: z.date().optional(),
      warrantyEnd: z.date().optional(),
      warrantyType: z.enum(["standard", "extended", "premium"]).optional(),
    });

    const data = schema.parse(req.body);
    const registration = await registerDevice({ ...data, createdBy: req.user.id });
    res.status(201).json(registration);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.get("/registrations/:registrationId", authenticate, async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const registration = await getDeviceRegistration(registrationId);
    res.json(registration);
  } catch (err) { next(err); }
});

router.get("/:sellerId/registrations", authenticate, async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const registrations = await getDeviceRegistrationsBySeller(sellerId);
    res.json({ registrations, count: registrations.length });
  } catch (err) { next(err); }
});

router.get("/registrations/device/:deviceId", authenticate, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const registrations = await getDeviceRegistrationsByDevice(deviceId);
    res.json({ registrations, count: registrations.length });
  } catch (err) { next(err); }
});

router.get("/registrations/customer/:customerEmail", authenticate, async (req, res, next) => {
  try {
    const { customerEmail } = req.params;
    const registrations = await getDeviceRegistrationsByCustomer(customerEmail);
    res.json({ registrations, count: registrations.length });
  } catch (err) { next(err); }
});

router.post("/registrations/:registrationId/transfer", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      newSellerId: z.string(),
    });

    const { registrationId } = req.params;
    const data = schema.parse(req.body);
    const registration = await transferDeviceRegistration(registrationId, data.newSellerId, req.user.id);
    res.json(registration);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.post("/registrations/:registrationId/cancel", authenticate, async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const registration = await cancelDeviceRegistration(registrationId, req.user.id);
    res.json(registration);
  } catch (err) { next(err); }
});

// ── Permission Checks ──────────────────────────────────────────────────────────────
router.post("/:sellerId/check-permission", authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      permission: z.string(),
    });

    const { sellerId } = req.params;
    const data = schema.parse(req.body);
    const result = await checkSellerPermission(sellerId, data.permission);
    res.json(result);
  } catch (err) {
    if (err.name === "ZodError") return res.status(400).json({ error: err.errors });
    next(err);
  }
});

// ── Statistics ───────────────────────────────────────────────────────────────────────
router.get("/:sellerId/statistics", authenticate, async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const stats = await getSellerStatistics(sellerId);
    res.json(stats);
  } catch (err) { next(err); }
});

router.get("/statistics", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getSellerResellerStatistics();
    res.json(stats);
  } catch (err) { next(err); }
});

export default router;
