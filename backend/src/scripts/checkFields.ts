import { connectDB } from '../config/db';
import { cricosCkanService } from '../services/cricos/cricosCkan.service';
import { CRICOS_RESOURCES } from '../config/cricosResources';

async function run() {
  await connectDB();
  const fields = await cricosCkanService.getResourceFields(CRICOS_RESOURCES.COURSES.id);
  console.log('COURSES FIELDS:', fields);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
