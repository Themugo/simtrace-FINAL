import { Router } from 'express';

const router = Router();

// GET /api/health - Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
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
      error: error.message
    });
  }
});

export default router;
