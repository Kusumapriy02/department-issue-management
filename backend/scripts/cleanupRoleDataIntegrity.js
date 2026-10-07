/**
 * TASK 4: DATABASE CLEANUP SCRIPT
 * ================================
 * 
 * This script fixes existing bad data where users have mixed role fields.
 * 
 * Examples of bad data:
 * - Student with teacherId (should only have registrationNumber, classroomId)
 * - Faculty/Admin with registrationNumber or classroomId (should only have teacherId)
 * 
 * Usage:
 *   node scripts/cleanupRoleDataIntegrity.js
 * 
 * This will:
 * 1. Remove teacherId from all students
 * 2. Remove registrationNumber, classroomId, courseType, specialization from faculty/admin
 * 3. Log detailed report of changes
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config/database');

async function cleanupRoleDataIntegrity() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(config.mongoURI, config.mongoOptions);
    console.log('✅ Connected to MongoDB\n');

    // ========================================================================
    // CLEANUP 1: Remove teacherId from all students
    // ========================================================================
    console.log('📋 CLEANUP 1: Removing teacherId from students...');
    const studentCleanup = await User.updateMany(
      { role: 'student' },
      { $unset: { teacherId: '' } }
    );
    console.log(`✅ Updated ${studentCleanup.modifiedCount} student(s)`);
    if (studentCleanup.modifiedCount > 0) {
      console.log(`   - Removed teacherId field from students\n`);
    }

    // ========================================================================
    // CLEANUP 2: Remove registrationNumber, classroomId, courseType, 
    //            specialization from faculty and admin
    // ========================================================================
    console.log('📋 CLEANUP 2: Removing student fields from faculty/admin...');
    const facultyAdminCleanup = await User.updateMany(
      { role: { $in: ['faculty', 'admin'] } },
      {
        $unset: {
          registrationNumber: '',
          classroomId: '',
          courseType: '',
          specialization: '',
        },
      }
    );
    console.log(`✅ Updated ${facultyAdminCleanup.modifiedCount} faculty/admin user(s)`);
    if (facultyAdminCleanup.modifiedCount > 0) {
      console.log(
        `   - Removed registrationNumber, classroomId, courseType, specialization\n`
      );
    }

    // ========================================================================
    // VERIFICATION: Check for data integrity violations
    // ========================================================================
    console.log('🔍 VERIFICATION: Checking for data integrity violations...\n');

    // Check 1: Students with teacherId (should be 0)
    const studentsWithTeacherId = await User.find({
      role: 'student',
      teacherId: { $exists: true, $ne: null },
    });
    if (studentsWithTeacherId.length > 0) {
      console.log(`⚠️  ALERT: Found ${studentsWithTeacherId.length} student(s) with teacherId:`);
      studentsWithTeacherId.forEach((user) => {
        console.log(`   - ${user.email} (${user._id}): teacherId = ${user.teacherId}`);
      });
    } else {
      console.log('✅ No students have teacherId (GOOD)');
    }

    // Check 2: Faculty/Admin without teacherId (should be 0)
    const facultyAdminWithoutTeacherId = await User.find({
      role: { $in: ['faculty', 'admin'] },
      teacherId: { $exists: false },
    });
    if (facultyAdminWithoutTeacherId.length > 0) {
      console.log(
        `⚠️  ALERT: Found ${facultyAdminWithoutTeacherId.length} faculty/admin user(s) without teacherId:`
      );
      facultyAdminWithoutTeacherId.forEach((user) => {
        console.log(`   - ${user.email} (${user._id}): Missing teacherId`);
      });
    } else {
      console.log('✅ All faculty/admin have teacherId (GOOD)');
    }

    // Check 3: Faculty/Admin with registrationNumber (should be 0)
    const facultyAdminWithRegNum = await User.find({
      role: { $in: ['faculty', 'admin'] },
      registrationNumber: { $exists: true, $ne: null },
    });
    if (facultyAdminWithRegNum.length > 0) {
      console.log(
        `⚠️  ALERT: Found ${facultyAdminWithRegNum.length} faculty/admin user(s) with registrationNumber:`
      );
      facultyAdminWithRegNum.forEach((user) => {
        console.log(
          `   - ${user.email} (${user._id}): registrationNumber = ${user.registrationNumber}`
        );
      });
    } else {
      console.log('✅ No faculty/admin have registrationNumber (GOOD)');
    }

    // Check 4: Faculty/Admin with classroomId (should be 0)
    const facultyAdminWithClassroom = await User.find({
      role: { $in: ['faculty', 'admin'] },
      classroomId: { $exists: true, $ne: null },
    });
    if (facultyAdminWithClassroom.length > 0) {
      console.log(
        `⚠️  ALERT: Found ${facultyAdminWithClassroom.length} faculty/admin user(s) with classroomId:`
      );
      facultyAdminWithClassroom.forEach((user) => {
        console.log(`   - ${user.email} (${user._id}): classroomId = ${user.classroomId}`);
      });
    } else {
      console.log('✅ No faculty/admin have classroomId (GOOD)');
    }

    // Check 5: Students without required fields
    const incompleteStudents = await User.find({
      role: 'student',
      $or: [
        { registrationNumber: { $exists: false } },
        { registrationNumber: null },
        { classroomId: { $exists: false } },
        { classroomId: null },
      ],
    });
    if (incompleteStudents.length > 0) {
      console.log(`⚠️  ALERT: Found ${incompleteStudents.length} student(s) with missing required fields:`);
      incompleteStudents.forEach((user) => {
        console.log(
          `   - ${user.email} (${user._id}): regNum=${user.registrationNumber}, classroom=${user.classroomId}`
        );
      });
    } else {
      console.log('✅ All students have required fields (GOOD)');
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total students cleaned: ${studentCleanup.modifiedCount}`);
    console.log(`Total faculty/admin cleaned: ${facultyAdminCleanup.modifiedCount}`);
    console.log(`\n✅ Database cleanup complete! Role-based data integrity enforced.`);
    console.log('='.repeat(70));

    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupRoleDataIntegrity();
