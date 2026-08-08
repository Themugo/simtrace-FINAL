import { Response } from "express";

export interface ApiResponsePayload<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  timestamp?: string;
  requestId?: string;
  meta?: Record<string, any>;
}

export function sendSuccess<T = any>(
  res: Response,
  data: T,
  message: string = "Operation completed successfully",
  statusCode: number = 200,
  meta?: Record<string, any>
): Response {
  const payload: ApiResponsePayload<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string = "An error occurred",
  statusCode: number = 500,
  errorCode: string = "INTERNAL_SERVER_ERROR",
  requestId?: string
): Response {
  const payload: ApiResponsePayload = {
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    requestId: requestId || (res.req?.headers["x-request-id"] as string),
  };

  return res.status(statusCode).json(payload);
}
