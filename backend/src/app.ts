import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import universityRoutes from './routes/university.routes';
import programRoutes from './routes/program.routes';
import adminRoutes from './routes/admin.routes';
import importsRoutes from './routes/imports.routes';
import stagedChangesRoutes from './routes/stagedChanges.routes';
import syncRoutes from './routes/sync.routes';
import comparisonRoutes from './routes/comparison.routes';
import studentProfileRoutes from './routes/studentProfile.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import aiSettingsRoutes from './routes/aiSettings.routes';
import recommendationsRoutes from './routes/recommendations.routes';
import publicAnalyticsRoutes from './routes/publicAnalytics.routes';
import trackerRoutes from './routes/applicationTracker.routes';
import applicationRoutes from './routes/application.routes';
import documentRoutes from './routes/document.routes';
import ingestionRoutes from './routes/ingestion.routes';
import cricosRoutes from './routes/cricos.routes';
import budgetPlanRoutes from './routes/budgetPlan.routes';
import scholarshipRoutes from './routes/scholarship.routes';
import adminScholarshipRoutes from './routes/admin.scholarship.routes';
import studentDashboardRoutes from './routes/studentDashboard.routes';
import healthRoutes from './routes/health.routes';
import metricsService from './services/metrics.service';
import { csrfProtection } from './middleware/auth.middleware';
import { aiLimiter, scrapeLimiter, importLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler, notFound, requestIdMiddleware } from './middleware/error.middleware';

const app = express();

// Request ID tracking
app.use(requestIdMiddleware);

// HTTP Metrics and Structured Request Latency Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsService.recordHttpRequest(res.statusCode, duration);
  });
  next();
});

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Controlled CORS configuration with credentials
app.use(cors({
  origin: env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-csrf-token'],
}));

// Cookie Parser with Secret
app.use(cookieParser(env.COOKIE_SECRET));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health and Observability probes (unauthenticated for infra monitors)
app.use('/health', healthRoutes);

// CSRF Protection for state-mutating requests
app.use(csrfProtection);

// Public & Student routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/universities', universityRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/comparison', comparisonRoutes);
app.use('/api/v1/profile', studentProfileRoutes);
app.use('/api/v1/copilot', aiLimiter, aiRoutes);
app.use('/api/v1/recommendations', recommendationsRoutes);
app.use('/api/v1/analytics', publicAnalyticsRoutes);
app.use('/api/v1/tracker', trackerRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/budget', budgetPlanRoutes);
app.use('/api/v1/scholarships', scholarshipRoutes);
app.use('/api/v1/dashboard', studentDashboardRoutes);

// Admin routes (require auth + admin role / permissions)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/imports', importLimiter, importsRoutes);
app.use('/api/v1/admin/staged-changes', stagedChangesRoutes);
app.use('/api/v1/admin/sync', scrapeLimiter, syncRoutes);
app.use('/api/v1/admin/analytics', analyticsRoutes);
app.use('/api/v1/admin/settings/ai', aiSettingsRoutes);
app.use('/api/v1/admin/cricos', scrapeLimiter, cricosRoutes);
app.use('/api/v1/admin/scholarships', adminScholarshipRoutes);
app.use('/api/v1/admin', ingestionRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
