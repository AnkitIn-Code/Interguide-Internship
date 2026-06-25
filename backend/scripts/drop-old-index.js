/**
 * drop-old-index.js
 * Run once: node backend/scripts/drop-old-index.js
 *
 * Drops the stale userId_1_internshipId_1 unique index from the applications
 * collection. This old index was created before the field names were changed
 * from userId/internshipId → user/internship.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('applications');

  // List all indexes so we can see what's there
  const indexes = await collection.indexes();
  console.log('\nExisting indexes:');
  indexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx.key)));

  const OLD_INDEX = 'userId_1_internshipId_1';

  const exists = indexes.some(idx => idx.name === OLD_INDEX);
  if (exists) {
    await collection.dropIndex(OLD_INDEX);
    console.log(`\n✅ Dropped index: ${OLD_INDEX}`);
  } else {
    console.log(`\nℹ️  Index "${OLD_INDEX}" not found – nothing to drop.`);
  }

  // Also drop any other stale unique indexes that reference null-able combo fields
  const stalePrefixes = ['userId_', 'internshipId_'];
  for (const idx of indexes) {
    if (idx.name !== '_id_' && stalePrefixes.some(p => idx.name.startsWith(p))) {
      if (idx.name !== OLD_INDEX) { // already handled above
        await collection.dropIndex(idx.name).catch(() => {});
        console.log(`✅ Also dropped stale index: ${idx.name}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('\nDone. Disconnected.');
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
