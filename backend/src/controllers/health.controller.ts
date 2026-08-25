import { Request, Response } from 'express';
import mongoose from 'mongoose';
import metricsService from '../services/metrics.service';
import { connection as redisClient } from '../config/redis';

export const healthController = {
  /**
   * GET /health/live
   * Liveness probe: verifies the node process is alive and responsive
   */
  getLiveness(req: Request, res: Response): void {
    const memory = process.memoryUsage();
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      pid: process.pid,
      memory: {
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      },
    });
  },

  /**
   * GET /health/ready
   * Readiness probe: checks database and cache readiness before routing traffic
   */
  async getReadiness(req: Request, res: Response): Promise<void> {
    const checks: Record<string, { status: 'healthy' | 'unhealthy' | 'degraded'; latencyMs?: number; error?: string }> = {};
    let isReady = true;

    // 1. MongoDB Readiness Check
    try {
      const start = Date.now();
      if (mongoose.connection.readyState !== 1) {
        throw new Error(`MongoDB readyState is ${mongoose.connection.readyState}`);
      }
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
      checks.database = {
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      isReady = false;
      checks.database = {
        status: 'unhealthy',
        error: err.message || 'Database connection error',
      };
    }

    // 2. Redis Readiness Check (Optional or graceful degradation)
    try {
      const start = Date.now();
      if (redisClient && typeof redisClient.ping === 'function') {
        const pingRes = await redisClient.ping();
        checks.redis = {
          status: pingRes === 'PONG' ? 'healthy' : 'degraded',
          latencyMs: Date.now() - start,
        };
      } else {
        checks.redis = {
          status: 'healthy',
          latencyMs: 0,
        };
      }
    } catch (err: any) {
      // Redis degradation does not completely block read queries if memory fallback is active
      checks.redis = {
        status: 'degraded',
        error: err.message || 'Redis cache ping failed',
      };
    }

    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json({
      status: isReady ? 'ready' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks,
    });
  },

  /**
   * GET /health/metrics
   * Prometheus / OpenTelemetry text metrics scrape endpoint
   */
  getMetrics(req: Request, res: Response): void {
    const prometheusData = metricsService.toPrometheusFormat();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(prometheusData);
  },

  /**
   * GET /health/snapshot
   * JSON telemetry snapshot for admin observability dashboard
   */
  getSnapshot(req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: metricsService.getSnapshot(),
    });
  },
};
