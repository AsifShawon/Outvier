import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import universityRoutes from './routes/university.routes';
import programRoutes from './routes/program.routes';
import adminRoutes from './routes/admin.routes';
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

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/universities', universityRoutes);
app.use('/api/v1/programs', programRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
