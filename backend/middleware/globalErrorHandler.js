// Global Error Handling System
// Centralized API error middleware with correlation IDs and structured error format

import { v4 as uuidv4 } from 'uuid';

// Error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUEUE_ERROR: 'QUEUE_ERROR',
};

// Custom error class
export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = ErrorCodes.INTERNAL_ERROR,
    details = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Generate correlation ID
export function generateCorrelationId() {
  return uuidv4();
}

// Generate worker tracing ID
export function generateWorkerId() {
  return `worker-${uuidv4()}`;
}

// Structured error response
export function formatErrorResponse(error, correlationId) {
  const isAppError = error instanceof AppError;
  
  return {
    success: false,
    error: {
      code: isAppError ? error.code : ErrorCodes.INTERNAL_ERROR,
      message: error.message,
      ...(error.details && { details: error.details }),
      correlationId,
      timestamp: new Date().toISOString(),
    },
  };
}

// Global error handler middleware
export function globalErrorHandler(err, req, res, next) {
  const correlationId = req.correlationId || generateCorrelationId();
  
  // Log error with correlation ID
  console.error(`[Error] Correlation ID: ${correlationId}`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
  });

  // Format error response
  const errorResponse = formatErrorResponse(err, correlationId);
  
  // Set status code
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json(errorResponse);
}

// Request correlation ID middleware
export function correlationIdMiddleware(req, res, next) {
  // Get correlation ID from header or generate new one
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  
  // Attach to request
  req.correlationId = correlationId;
  
  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
}

// Async error wrapper
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Worker error handler
export function workerErrorHandler(error, jobId, workerName) {
  const workerId = generateWorkerId();
  
  console.error(`[Worker Error] Worker: ${workerName}, Job: ${jobId}, Worker ID: ${workerId}`, {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  return {
    success: false,
    error: error.message,
    workerId,
    jobId,
    workerName,
    timestamp: new Date().toISOString(),
  };
}

// Export error codes
export { ErrorCodes };
