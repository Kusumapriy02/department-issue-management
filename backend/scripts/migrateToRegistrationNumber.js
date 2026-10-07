/**
 * Migration Script: Migrate rollNumber to registrationNumber
 * 
 * PURPOSE:
 * - Updates all student users who have rollNumber but no registrationNumber
 * - Auto-migrates rollNumber → registrationNumber for backward compatibility
 * - Helps old users to be editable through the new role-based system
 * 
 * USAGE:
 * node backend/scripts/migrateToRegistrationNumber.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const migrateToRegistrationNumber = async () => {
  try {
    console.log('='.repeat(60));
    console.log('🔄 MIGRATION: rollNumber → registrationNumber');
    console.log('='.repeat(60));

    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/college_system';
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Find all student users with rollNumber but no registrationNumber
    const studentsToMigrate = await User.find({
      role: 'student',
      registrationNumber: { $exists: false },
      rollNumber: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`\n📊 Found ${studentsToMigrate.length} students to migrate`);

    if (studentsToMigrate.length === 0) {
      console.log('✅ No migration needed - all students already have registrationNumber');
      await mongoose.connection.close();
      return;
    }

    // Perform bulk update
    const result = await User.updateMany(
      {
        role: 'student',
        registrationNumber: { $exists: false },
        rollNumber: { $exists: true, $ne: null, $ne: '' }
      },
      [
        {
          $set: {
            registrationNumber: '$rollNumber'
          }
        }
      ]
    );

    console.log('\n📝 Migration Results:');
    console.log(`   - Matched: ${result.matchedCount} documents`);
    console.log(`   - Modified: ${result.modifiedCount} documents`);

    // Verify migration
    const verifyMigration = await User.find({
      role: 'student',
      registrationNumber: { $exists: true, $ne: null }
    });

    console.log(`\n✅ Verified: ${verifyMigration.length} students now have registrationNumber`);

    // Show sample of migrated users
    console.log('\n📋 Sample of migrated users:');
    studentsToMigrate.slice(0, 3).forEach((student, idx) => {
      console.log(`   ${idx + 1}. ${student.name} (${student.email})`);
      console.log(`      rollNumber: ${student.rollNumber}`);
      console.log(`      registrationNumber: ${student.rollNumber} (migrated)`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));

    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:');
    console.error(error.message);
    process.exit(1);
  }
};

// Run migration
migrateToRegistrationNumber();
