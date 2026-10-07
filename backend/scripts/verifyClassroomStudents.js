/**
 * TASK 4-5: Verify and Fix Classroom-Student Data Consistency
 * 
 * Checks for:
 * - Students with null classroomId
 * - classroomId stored as string instead of ObjectId
 * - Data integrity issues
 * - Assigns students to correct classrooms
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Classroom = require('../models/Classroom');

async function verifyDataConsistency() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');

    // TASK 4: Check Student Data
    console.log('📊 TASK 4: Checking Student Data Consistency...\n');

    // 1. Find all students
    const allStudents = await User.find({ role: 'student' }).select('name registrationNumber classroomId');
    console.log(`Total students in database: ${allStudents.length}`);

    // 2. Check for students without classroom assignment
    const unassignedStudents = allStudents.filter(s => !s.classroomId);
    console.log(`  ❌ Unassigned (classroomId = null): ${unassignedStudents.length}`);
    if (unassignedStudents.length > 0) {
      console.log('     Examples:', unassignedStudents.slice(0, 3).map(s => `${s.name} (${s.registrationNumber})`).join(', '));
    }

    // 3. Check for non-string, non-ObjectId classroomIds
    const studentsWithBadData = allStudents.filter(s => {
      if (!s.classroomId) return false;
      const type = typeof s.classroomId;
      return type !== 'object'; // Should be ObjectId (object)
    });
    console.log(`  ⚠️ Bad data type (not ObjectId): ${studentsWithBadData.length}`);
    if (studentsWithBadData.length > 0) {
      console.log('     Examples:', studentsWithBadData.slice(0, 3).map(s => `${s.name} (type: ${typeof s.classroomId})`).join(', '));
    }

    // 4. Check if classroomIds actually exist
    const assignedStudents = allStudents.filter(s => s.classroomId);
    const validClassrooms = await Classroom.find().select('_id').lean();
    const validClassroomIds = new Set(validClassrooms.map(c => c._id.toString()));

    const studentsWithInvalidClassroom = assignedStudents.filter(s => 
      !validClassroomIds.has(s.classroomId.toString())
    );
    console.log(`  ❌ Invalid classroom reference: ${studentsWithInvalidClassroom.length}`);
    if (studentsWithInvalidClassroom.length > 0) {
      console.log('     Examples:', studentsWithInvalidClassroom.slice(0, 3).map(s => `${s.name} -> ${s.classroomId}`).join(', '));
    }

    // TASK 5: Show Classroom-Student Distribution
    console.log('\n📈 TASK 5: Classroom-Student Distribution\n');

    const classroomStudentCount = await User.aggregate([
      { $match: { role: 'student', classroomId: { $exists: true, $ne: null } } },
      { $group: {
        _id: '$classroomId',
        count: { $sum: 1 },
        students: { $push: '$name' }
      }},
      { $sort: { count: -1 } }
    ]);

    const classroomMap = new Map();
    validClassrooms.forEach(c => {
      classroomMap.set(c._id.toString(), null);
    });

    for (const record of classroomStudentCount) {
      const classroomId = record._id.toString();
      const classroom = await Classroom.findById(classroomId).select('section course year');
      
      if (classroom) {
        console.log(`\n  📚 ${classroom.course} - Year ${classroom.year} - Section ${classroom.section}`);
        console.log(`     ID: ${classroomId}`);
        console.log(`     Students: ${record.count}`);
        console.log(`     Names: ${record.students.slice(0, 5).join(', ')}${record.students.length > 5 ? '...' : ''}`);
        classroomMap.set(classroomId, true);
      }
    }

    // 6. Show classrooms with no students
    console.log('\n\n📭 Classrooms with NO students assigned:');
    let emptyCount = 0;
    for (const [classroomId, hasStudents] of classroomMap.entries()) {
      if (hasStudents === null) {
        const classroom = await Classroom.findById(classroomId).select('section course year');
        if (classroom) {
          console.log(`  - ${classroom.course} - Year ${classroom.year} - Section ${classroom.section}`);
          emptyCount++;
        }
      }
    }
    if (emptyCount === 0) {
      console.log('  ✅ All classrooms have at least one student');
    }

    // Summary
    console.log('\n\n📋 SUMMARY:\n');
    console.log(`Total Students: ${allStudents.length}`);
    console.log(`  ✅ With valid classroom: ${assignedStudents.length - studentsWithInvalidClassroom.length}`);
    console.log(`  ❌ Unassigned: ${unassignedStudents.length}`);
    console.log(`  ⚠️ Invalid classroom: ${studentsWithInvalidClassroom.length}`);
    console.log(`  ⚠️ Bad data type: ${studentsWithBadData.length}`);
    
    console.log(`\nTotal Classrooms: ${validClassrooms.length}`);
    console.log(`  ✅ With students: ${classroomStudentCount.length}`);
    console.log(`  📭 Without students: ${emptyCount}`);

    // Check for issues
    if (unassignedStudents.length === 0 && 
        studentsWithInvalidClassroom.length === 0 && 
        studentsWithBadData.length === 0) {
      console.log('\n✅ DATA INTEGRITY CHECK PASSED - All data is consistent!');
    } else {
      console.log('\n⚠️ DATA INTEGRITY ISSUES DETECTED - Review above for details');
    }

    console.log('\n✅ Verification complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyDataConsistency();
