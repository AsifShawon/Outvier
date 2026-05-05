/**
 * Standalone worker process — run this separately from the HTTP server.
 * Usage: npm run dev:worker
 *
 * This process connects to MongoDB and Redis, then starts all BullMQ workers.
 * Workers process queued jobs (sync, crawl, ranking, outcome, ingestion, etc.) asynchronously.
 */
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db';
import { closeWorkers } from './workers';
import './workers'; // initialise all workers

const startWorkers = async () => {
  await connectDB();
  console.log('👷 Outvier worker process started');
  console.log('   Sync queues: university-sync, program-sync, tuition-sync, scholarship-sync, ranking-sync, outcome-sync');
  console.log('   Ingestion queues: program-discovery, batch-import');
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down workers gracefully...');
  await closeWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down workers gracefully...');
  await closeWorkers();
  process.exit(0);
});

startWorkers();
