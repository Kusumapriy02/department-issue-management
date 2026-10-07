/**
 * TASK 4: Clean Old Data - Fix classroomId Data Type Issues
 * 
 * Identifies and fixes students with incorrect classroomId storage:
 * - Converts string classroomId to ObjectId
 * - Handles null/undefined values
 * - Validates against actual classrooms
 * - Reports what was fixed
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Classroom = require('../models/Classroom');

async function fixClassroomIdTypes() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ TASK 4: FIX classroomId DATA TYPE ISSUES                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    // STEP 1: Analyze current data types
    console.log('STEP 1: Analyzing classroomId Data Types\n');

    const typeAnalysis = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: { $type: '$classroomId' },
          count: { $sum: 1 },
          samples: { $push: { 
            _id: '$_id',
            name: '$name', 
            classroomId: '$classroomId' 
          } },
        },
      },
    ]);

    console.log('[Data Types Found]:');
    typeAnalysis.forEach(record => {
      console.log(`  ${record._id}: ${record.count} students`);
    });

    // STEP 2: Get all classrooms for validation
    const allClassrooms = await Classroom.find().select('_id').lean();
    const validClassroomIds = new Set(allClassrooms.map(c => c._id.toString()));
    console.log(`\n[Valid Classroom IDs]: ${validClassroomIds.size} total\n`);

    // STEP 3: Process each type
    let fixed = 0;
    let notFound = 0;
    let alreadyCorrect = 0;

    console.log('STEP 2: Processing Students\n');

    // Get all students
    const allStudents = await User.find({ role: 'student' })
      .select('name registrationNumber classroomId');

    for (const student of allStudents) {
      const cid = student.classroomId;

      // Case 1: Already ObjectId (correct)
      if (cid instanceof mongoose.Types.ObjectId) {
        const idString = cid.toString();
        if (validClassroomIds.has(idString)) {
          alreadyCorrect++;
        } else {
          console.log(`  ⚠️  [${student.name}] Invalid classroom reference: ${idString}`);
          // Clear invalid reference
          await User.updateOne(
            { _id: student._id },
            { $set: { classroomId: null } }
          );
          notFound++;
        }
      }
      // Case 2: String (needs conversion)
      else if (typeof cid === 'string') {
        console.log(`  🔄 [${student.name}] Converting string to ObjectId: "${cid}"`);
        
        // Validate string is valid ObjectId format
        if (mongoose.Types.ObjectId.isValid(cid)) {
          const objId = new mongoose.Types.ObjectId(cid);
          const idString = objId.toString();
          
          if (validClassroomIds.has(idString)) {
            // Convert string to ObjectId
            await User.updateOne(
              { _id: student._id },
              { $set: { classroomId: objId } }
            );
            console.log(`     ✅ Converted successfully`);
            fixed++;
          } else {
            console.log(`     ❌ Invalid classroom reference: ${idString}`);
            await User.updateOne(
              { _id: student._id },
              { $set: { classroomId: null } }
            );
            notFound++;
          }
        } else {
          console.log(`     ❌ Invalid ObjectId format: "${cid}"`);
          await User.updateOne(
            { _id: student._id },
            { $set: { classroomId: null } }
          );
          notFound++;
        }
      }
      // Case 3: Null or undefined (no action needed)
      else if (!cid) {
        // No action needed, already null/undefined
      }
    }

    // STEP 4: Verify fix
    console.log('\n\nSTEP 3: Verifying Fix\n');

    const typeAnalysisAfter = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: { $type: '$classroomId' },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('[Data Types After Fix]:');
    typeAnalysisAfter.forEach(record => {
      if (record._id === 'objectId') {
        console.log(`  ✅ ${record._id}: ${record.count} students`);
      } else {
        console.log(`  ℹ️  ${record._id}: ${record.count} students`);
      }
    });

    // STEP 5: Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ SUMMARY                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Students: ${allStudents.length}`);
    console.log(`  ✅ Already Correct (ObjectId): ${alreadyCorrect}`);
    console.log(`  🔄 Fixed (String → ObjectId): ${fixed}`);
    console.log(`  ❌ Invalid References Cleared: ${notFound}`);

    if (fixed > 0) {
      console.log(`\n✅ FIXED ${fixed} students with string classroomId!`);
    } else {
      console.log('\n✅ No fixes needed - all classroomId values are correct type!');
    }

    // STEP 6: Show sample of each classroom
    console.log('\n\nSTEP 4: Classroom Distribution After Fix\n');

    const distribution = await User.aggregate([
      { $match: { role: 'student', classroomId: { $ne: null } } },
      {
        $group: {
          _id: '$classroomId',
          count: { $sum: 1 },
          names: { $push: '$name' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log(`[Classrooms with students]: ${distribution.length}\n`);

    for (const record of distribution) {
      const classroom = await Classroom.findById(record._id).select('course specialization year section');
      if (classroom) {
        const label = `${classroom.course} - ${classroom.specialization} Year ${classroom.year} Section ${classroom.section}`;
        console.log(`  ${label}`);
        console.log(`    Students: ${record.count}`);
        console.log(`    ID: ${record._id}`);
        console.log(`    Examples: ${record.names.slice(0, 3).join(', ')}${record.names.length > 3 ? ', ...' : ''}`);
      }
    }

    console.log('\n✅ Data cleanup complete!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixClassroomIdTypes();
