import app from './app';
import { connectDB } from './config/db';

import { closeWorkers } from './jobs/workers';
import './jobs/workers'; // Initialize workers

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api/v1`);
    console.log(`👷 BullMQ Workers started`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeWorkers();
  process.exit(0);
});

startServer();
