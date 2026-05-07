import mongoose from 'mongoose';
import { programService } from './src/services/program.service';

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/outvier');
    console.log('Connected');
    
    console.log('Testing getCities...');
    const cities = await programService.getCities();
    console.log('Cities:', cities.slice(0, 5));
    
    console.log('Testing getAll with city...');
    const result = await programService.getAll({ city: 'Adelaide', limit: 1 });
    console.log('Programs found:', result.pagination.total);
    
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

test();
