const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/department_management');
  
  const result = await mongoose.connection.db
    .collection('assets')
    .updateMany({}, { $unset: { damaged: '', maintenance: '' } });

  console.log('Stripped damaged/maintenance from', result.modifiedCount, 'existing asset documents');
  await mongoose.disconnect();
}

cleanup().catch(e => { console.error('Error:', e.message); process.exit(1); });
