/**
 * MIGRATION SCRIPT: Update Issue Priority Enum Values
 * 
 * Maps old priority values to new enum values:
 * - Low → Minor
 * - Medium → Normal
 * - High → Important
 * - Critical → Urgent
 * 
 * Run with: node scripts/migratePriority.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Models
const Issue = require('../models/Issue');

// Mapping of old values to new values
const PRIORITY_MAP = {
  'Low': 'Minor',
  'Medium': 'Normal',
  'High': 'Important',
  'Critical': 'Urgent',
};

/**
 * Perform the migration
 */
async function migrate() {
  let startTime = Date.now();
  
  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/finalyr', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully\n');

    // Fetch current statistics BEFORE migration
    console.log('📊 BEFORE MIGRATION STATISTICS:');
    const stats = {};
    for (const oldValue of Object.keys(PRIORITY_MAP)) {
      const count = await Issue.countDocuments({ priority: oldValue });
      stats[oldValue] = count;
      console.log(`  • ${oldValue}: ${count} documents`);
    }

    const totalOldDocs = Object.values(stats).reduce((a, b) => a + b, 0);
    console.log(`  • TOTAL with old values: ${totalOldDocs}\n`);

    // Perform migrations for each priority level
    console.log('🔄 MIGRATING PRIORITY VALUES:');
    let totalMigrated = 0;

    for (const [oldValue, newValue] of Object.entries(PRIORITY_MAP)) {
      try {
        const result = await Issue.updateMany(
          { priority: oldValue },
          { $set: { priority: newValue } }
        );

        const migratedCount = result.modifiedCount;
        totalMigrated += migratedCount;

        console.log(`  ✓ ${oldValue} → ${newValue}`);
        console.log(`    - Matched: ${result.matchedCount}`);
        console.log(`    - Modified: ${migratedCount}`);
      } catch (error) {
        console.error(`  ✗ FAILED to migrate ${oldValue} → ${newValue}`);
        console.error(`    Error: ${error.message}`);
        throw error;
      }
    }

    console.log(`\n✅ TOTAL DOCUMENTS MIGRATED: ${totalMigrated}\n`);

    // Fetch statistics AFTER migration
    console.log('📊 AFTER MIGRATION STATISTICS:');
    let newStats = {};
    for (const newValue of Object.values(PRIORITY_MAP)) {
      const count = await Issue.countDocuments({ priority: newValue });
      newStats[newValue] = count;
      console.log(`  • ${newValue}: ${count} documents`);
    }

    // Check for any remaining old values (should be 0)
    console.log('\n⚠️  VALIDATION CHECK:');
    const oldValues = Object.keys(PRIORITY_MAP);
    for (const oldValue of oldValues) {
      const count = await Issue.countDocuments({ priority: oldValue });
      if (count > 0) {
        console.log(`  ✗ WARNING: Found ${count} documents still with "${oldValue}"`);
      }
    }

    console.log('  ✅ No old priority values remaining in database\n');

    // Summary
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('═══════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════');
    console.log(`  Total Documents Migrated: ${totalMigrated}`);
    console.log(`  Duration: ${duration.toFixed(2)}s`);
    console.log(`  Status: All old priority values converted\n`);

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED');
    console.error('═══════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('───────────────────────────────────────────');
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    // Always disconnect
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

// Run migration
migrate();
