import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/apiResponse.js";
import { logger } from "../config/logger.js";

export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req.headers["x-request-id"] as string) || "N/A";

  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected server error occurred";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = err.message;
  } else if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    statusCode = 401;
    errorCode = "AUTHENTICATION_ERROR";
    message = "Invalid or expired authorization token";
  } else if (err.name === "CastError") {
    statusCode = 400;
    errorCode = "INVALID_ID_FORMAT";
    message = `Invalid value for ${err.path}`;
  } else if (err.message) {
    message = err.message;
  }

  logger.error({
    msg: `[ErrorMiddleware] ${statusCode} ${errorCode}: ${message}`,
    requestId,
    method: req.method,
    url: req.originalUrl,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  sendError(res, message, statusCode, errorCode, requestId);
}

export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction): void {
  const requestId = (req.headers["x-request-id"] as string) || "N/A";
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404, "RESOURCE_NOT_FOUND", requestId);
}
