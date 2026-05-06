import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import ingestionRoutes from './routes/ingestion.routes';
import cricosRoutes from './routes/cricos.routes';
import { errorHandler, notFound } from './middleware/error.middleware';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/universities', universityRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/comparison', comparisonRoutes);
app.use('/api/v1/profile', studentProfileRoutes);
app.use('/api/v1/copilot', aiRoutes);
app.use('/api/v1/recommendations', recommendationsRoutes);
app.use('/api/v1/analytics', publicAnalyticsRoutes);
app.use('/api/v1/tracker', trackerRoutes);

// Admin routes (all require auth + admin role)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/imports', importsRoutes);
app.use('/api/v1/admin/staged-changes', stagedChangesRoutes);
app.use('/api/v1/admin/sync', syncRoutes);
app.use('/api/v1/admin/analytics', analyticsRoutes);
app.use('/api/v1/admin/settings/ai', aiSettingsRoutes);
app.use('/api/v1/admin/cricos', cricosRoutes);
app.use('/api/v1/admin', ingestionRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
