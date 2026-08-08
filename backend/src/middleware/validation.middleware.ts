import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        return next(AppError.badRequest(`Validation failed: ${issues}`, err.issues));
      }
      next(err);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        return next(AppError.badRequest(`Query validation failed: ${issues}`, err.issues));
      }
      next(err);
    }
  };
}
