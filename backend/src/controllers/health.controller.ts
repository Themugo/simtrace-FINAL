import { Request, Response } from "express";
import { isDatabaseConnected } from "../config/database.js";
import { sendSuccess } from "../utils/apiResponse.js";

const startTime = Date.now();

export function getHealthStatus(req: Request, res: Response): void {
  const dbConnected = isDatabaseConnected();
  const uptimeSeconds = (Date.now() - startTime) / 1000;

  const healthData = {
    status: dbConnected ? "healthy" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
    uptime: `${uptimeSeconds.toFixed(2)}s`,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    memoryUsage: process.memoryUsage(),
  };

  sendSuccess(res, healthData, "System health status retrieved");
}
