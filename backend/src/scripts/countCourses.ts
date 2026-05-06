import { connectDB } from '../config/db';
import { cricosCkanService } from '../services/cricos/cricosCkan.service';
import { CRICOS_RESOURCES } from '../config/cricosResources';

async function run() {
  await connectDB();
  const providerCode = '00008C';
  const courses = await cricosCkanService.queryByProviderCode(CRICOS_RESOURCES.COURSES.id, providerCode);
  console.log(`COURSES FOUND FOR ${providerCode}:`, courses.length);
  if (courses.length > 0) {
     console.log('FIRST COURSE:', courses[0]['Course Name']);
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
