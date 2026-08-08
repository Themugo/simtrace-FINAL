import pino from "pino";
import pinoHttp from "pino-http";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { env } from "./environment.js";

export const logger = pino({
  level: env.LOG_LEVEL || "info",
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});

export const httpLoggerMiddleware = pinoHttp({
  logger,
  genReqId: (req: Request) => {
    const existingId = req.headers["x-request-id"] as string;
    if (existingId) return existingId;
    const newId = uuidv4();
    req.headers["x-request-id"] = newId;
    return newId;
  },
  customLogLevel: (req: Request, res: Response, err?: Error) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req: Request, res: Response, responseTime: number) => {
    return `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${responseTime}ms`;
  },
  customErrorMessage: (req: Request, res: Response, err: Error) => {
    return `Request failed: ${req.method} ${req.originalUrl || req.url} - ${err.message}`;
  },
  customProps: (req: Request, res: Response) => {
    const user = (req as any).user;
    return {
      requestId: req.headers["x-request-id"],
      userId: user ? user.id || user._id : undefined,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: res.statusCode,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    };
  },
});
