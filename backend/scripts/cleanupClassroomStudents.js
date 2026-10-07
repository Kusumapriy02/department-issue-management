/**
 * TASK 6: Data Cleanup Script
 * 
 * Remove classroomId from non-students (Faculty, Admin, HOD)
 * This ensures data integrity - only students should have classroom assignments
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

async function cleanupClassroomStudents() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Step 1: Find all non-student users with classroomId
    console.log('\n📊 Finding non-students with classroomId...');
    const nonStudentsWithClassroom = await User.find({
      role: { $ne: 'student' },
      classroomId: { $exists: true, $ne: null }
    }).select('name email role classroomId');

    console.log(`Found ${nonStudentsWithClassroom.length} non-students with classroom assignments:`);
    nonStudentsWithClassroom.forEach(user => {
      console.log(`  - ${user.name} (${user.role}): classroomId = ${user.classroomId}`);
    });

    // Step 2: Remove classroomId from all non-students
    if (nonStudentsWithClassroom.length > 0) {
      console.log('\n🧹 Removing classroomId from non-students...');
      const result = await User.updateMany(
        { role: { $ne: 'student' } },
        { $unset: { classroomId: '' } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} records`);
    } else {
      console.log('✅ No non-students found with classroom assignments');
    }

    // Step 3: Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const remainingNonStudents = await User.find({
      role: { $ne: 'student' },
      classroomId: { $exists: true, $ne: null }
    }).select('name email role');

    if (remainingNonStudents.length === 0) {
      console.log('✅ Verification passed: No non-students with classroomId');
    } else {
      console.log(`⚠️ Warning: ${remainingNonStudents.length} non-students still have classroomId`);
    }

    // Step 4: Get student statistics
    console.log('\n📈 Student Assignment Summary:');
    const studentStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: {
        _id: '$classroomId',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);

    console.log(`Total students: ${studentStats.reduce((sum, stat) => sum + stat.count, 0)}`);
    console.log('Students per classroom:');
    studentStats.forEach(stat => {
      console.log(`  - Classroom ${stat._id || 'UNASSIGNED'}: ${stat.count} students`);
    });

    console.log('\n✅ Cleanup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

cleanupClassroomStudents();
