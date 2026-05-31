/**
 * Global error handling middleware
 * Catches and formats errors consistently across the application
 */
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Generate unique request ID for tracking
export const generateRequestId = (): string => crypto.randomUUID();

export const errorHandler = (err: any, req: Request & { id?: string; user?: any }, res: Response, next: NextFunction) => {
  const requestId = req.id || generateRequestId();
  const isDev = process.env.NODE_ENV !== 'production';

  // Log error with structured data
  const errorLog = {
    requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    error: {
      name: err.name,
      message: err.message,
      ...(isDev && { stack: err.stack })
    },
    user: req.user?.id || 'anonymous',
    ip: req.ip || req.connection?.remoteAddress
  };

  // Log to console (in production, this would go to a logging service)
  console.error('[ERROR]', JSON.stringify(errorLog));

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message,
      requestId
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      details: err.message,
      requestId
    });
  }

  if (err.code === 11000) {
    // Duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: 'Duplicate entry',
      details: `${field} already exists`,
      requestId
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      details: 'Please provide a valid authentication token',
      requestId
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      details: 'Please login again',
      requestId
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'Authentication required',
      requestId
    });
  }

  // Handle custom AppError instances
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(isDev && { details: err.details }),
      requestId
    });
  }

  // Handle MongoDB connection errors
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    return res.status(503).json({
      error: 'Database error',
      details: 'Unable to connect to database',
      requestId
    });
  }

  // Handle Redis connection errors
  if (err.message && err.message.includes('Redis')) {
    return res.status(503).json({
      error: 'Cache error',
      details: 'Unable to connect to cache service',
      requestId
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : message,
    requestId,
    ...(isDev && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request & { id?: string }, res: Response, next: NextFunction) => {
  const requestId = req.id || generateRequestId();
  
  res.status(404).json({
    error: 'Not Found',
    details: `Route ${req.method} ${req.path} not found`,
    requestId
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error classes
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}
