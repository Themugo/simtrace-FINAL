import { Router, Request, Response, NextFunction } from 'express';
import { integrationSummary } from '../services/integrations.js';

const router = Router();

// GET /api/health/integrations - which integrations are plugged in (keys present)
router.get('/integrations', (_req: Request, res: Response) => {
  res.json(integrationSummary());
});

interface HealthCheck {
  uptime: number;
  message: string;
  timestamp: number;
  environment: string;
  services: {
    database: string;
    redis: string;
  };
}

// GET /api/health - Health check endpoint
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const healthCheck: HealthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    };

    // Check database connection
    try {
      const mongoose = await import('mongoose');
      healthCheck.services.database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (error) {
      healthCheck.services.database = 'error';
    }

    // Check Redis connection
    try {
      const { getRedisClient } = await import('../services/redis.js');
      const redis = getRedisClient();
      if (redis) {
        await redis.ping();
        healthCheck.services.redis = 'connected';
      } else {
        healthCheck.services.redis = 'disconnected';
      }
    } catch (error) {
      healthCheck.services.redis = 'error';
    }

    // Determine overall health status
    const allServicesHealthy = Object.values(healthCheck.services).every(status => status === 'connected');
    const statusCode = allServicesHealthy ? 200 : 503;

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      uptime: process.uptime(),
      message: 'ERROR',
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
