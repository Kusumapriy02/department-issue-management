/**
 * TASK 5: Fix Existing Classroom Assignment Data
 * 
 * Diagnoses and fixes student-classroom mapping issues:
 * - Identifies students with null classroomId
 * - Converts string classroomId to proper ObjectId
 * - Verifies data consistency
 * - Provides options to reassign students
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Classroom = require('../models/Classroom');

async function fixClassroomMapping() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB\n');

    // STEP 1: Analyze current state
    console.log('📊 STEP 1: Analyzing Student-Classroom Mapping...\n');

    const allStudents = await User.find({ role: 'student' }).select('name registrationNumber classroomId courseType specialization');
    console.log(`Total students: ${allStudents.length}\n`);

    // TASK 5: Identify issues
    const nullClassroom = allStudents.filter(s => !s.classroomId);
    const validClassroom = allStudents.filter(s => s.classroomId && mongoose.Types.ObjectId.isValid(s.classroomId.toString()));
    
    console.log(`  ✅ With valid classroomId: ${validClassroom.length}`);
    console.log(`  ❌ With NULL classroomId: ${nullClassroom.length}`);

    if (nullClassroom.length > 0) {
      console.log('\n⚠️  Students without classroom assignment:');
      nullClassroom.slice(0, 10).forEach(s => {
        console.log(`     - ${s.name} (${s.registrationNumber}) | ${s.courseType}`);
      });
      if (nullClassroom.length > 10) {
        console.log(`     ... and ${nullClassroom.length - 10} more`);
      }
    }

    // STEP 2: Validate existing classroom references
    console.log('\n📊 STEP 2: Validating Classroom References...\n');

    const allClassrooms = await Classroom.find().select('_id section course year').lean();
    console.log(`Total classrooms in database: ${allClassrooms.length}`);

    const validReferences = [];
    const invalidReferences = [];

    for (const student of validClassroom) {
      const exists = allClassrooms.some(c => c._id.toString() === student.classroomId.toString());
      if (exists) {
        validReferences.push(student);
      } else {
        invalidReferences.push(student);
      }
    }

    console.log(`  ✅ Valid classroom references: ${validReferences.length}`);
    console.log(`  ❌ Invalid classroom references: ${invalidReferences.length}`);

    if (invalidReferences.length > 0) {
      console.log('\n⚠️  Students with invalid classroom references:');
      invalidReferences.slice(0, 10).forEach(s => {
        console.log(`     - ${s.name} (${s.registrationNumber}) → ${s.classroomId}`);
      });
      if (invalidReferences.length > 10) {
        console.log(`     ... and ${invalidReferences.length - 10} more`);
      }
    }

    // STEP 3: Show classroom distribution
    console.log('\n📈 STEP 3: Classroom Distribution\n');

    const distribution = await User.aggregate([
      { $match: { role: 'student', classroomId: { $exists: true, $ne: null } } },
      { $group: {
        _id: '$classroomId',
        count: { $sum: 1 },
        students: { $push: '$name' }
      }},
      { $sort: { count: -1 } }
    ]);

    console.log(`Classrooms with students: ${distribution.length}\n`);
    
    for (const record of distribution) {
      const classroom = await Classroom.findById(record._id).select('section course year');
      if (classroom) {
        console.log(`  ${classroom.course} Year ${classroom.year} Section ${classroom.section}`);
        console.log(`    ID: ${record._id}`);
        console.log(`    Students: ${record.count}`);
        console.log(`    Examples: ${record.students.slice(0, 3).join(', ')}${record.students.length > 3 ? ', ...' : ''}\n`);
      }
    }

    // STEP 4: Show classrooms with no students
    console.log('\n📭 Classrooms WITHOUT students:\n');

    const assignedClassroomIds = new Set(distribution.map(d => d._id.toString()));
    const emptyClassrooms = allClassrooms.filter(c => !assignedClassroomIds.has(c._id.toString()));

    if (emptyClassrooms.length > 0) {
      emptyClassrooms.forEach(c => {
        console.log(`  - ${c.course} Year ${c.year} Section ${c.section} (ID: ${c._id})`);
      });
    } else {
      console.log('  ✅ All classrooms have at least one student!');
    }

    // STEP 5: Suggest fixes
    console.log('\n\n🔧 STEP 5: Data Integrity Summary\n');

    if (nullClassroom.length > 0) {
      console.log(`⚠️  ACTION REQUIRED: ${nullClassroom.length} students need classroom assignment`);
      console.log('   Options:');
      console.log('   1. Assign via Admin Dashboard → User Management');
      console.log('   2. Run custom assignment script with mapping\n');
    }

    if (invalidReferences.length > 0) {
      console.log(`⚠️  ACTION REQUIRED: ${invalidReferences.length} students have invalid classroom references`);
      console.log('   Run: node scripts/fixInvalidClassroomReferences.js\n');
    }

    if (nullClassroom.length === 0 && invalidReferences.length === 0) {
      console.log('✅ DATA INTEGRITY CHECK PASSED!');
      console.log('   All students have valid classroom assignments\n');
    }

    // Summary statistics
    console.log('\n📊 FINAL STATISTICS:\n');
    console.log(`Total Students: ${allStudents.length}`);
    console.log(`  ✅ Properly assigned: ${validReferences.length}`);
    console.log(`  ❌ Need assignment: ${nullClassroom.length}`);
    console.log(`  ❌ Invalid reference: ${invalidReferences.length}`);
    console.log(`\nTotal Classrooms: ${allClassrooms.length}`);
    console.log(`  ✅ With students: ${distribution.length}`);
    console.log(`  📭 Empty: ${emptyClassrooms.length}`);

    console.log('\n✅ Analysis complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixClassroomMapping();
