import { connectDB } from '../config/db';
import { cricosSyncService } from '../services/cricos/cricosSync.service';
import mongoose from 'mongoose';

async function run() {
  console.log("🚀 Starting Bulk CRICOS Institution Sync...");
  
  try {
    await connectDB();
    
    const runId = await cricosSyncService.syncAllInstitutions("cli_seed");
    
    console.log(`✅ Bulk sync initiated. Run ID: ${runId}`);
    console.log("Check the admin dashboard for progress.");
    
    // Give it a moment to ensure DB writes are flushed
    setTimeout(() => {
      mongoose.disconnect();
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

run();
