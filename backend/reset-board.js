const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/outvier', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    await mongoose.connection.collection('trackerboards').deleteMany({});
    await mongoose.connection.collection('applicationtrackers').updateMany({}, { $unset: { boardId: '', columnId: '' } });
    console.log('Board reset successful');
    process.exit(0);
  })
  .catch(err => console.error(err));
