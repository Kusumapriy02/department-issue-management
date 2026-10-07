/**
 * Direct test of getClassroomStudents controller with debug output
 * This bypasses HTTP and calls the controller directly
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Classroom = require('../models/Classroom');
const { getClassroomStudents } = require('../controllers/classroomController');

async function testGetClassroomStudents() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ TESTING getClassroomStudents CONTROLLER                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB\n');

    // Get first classroom with students
    const classroom = await Classroom.findOne().lean();
    if (!classroom) {
      console.log('❌ No classrooms found');
      process.exit(1);
    }

    console.log(`📌 Testing with Classroom: ${classroom._id}`);
    console.log(`   Label: ${classroom.course} - ${classroom.specialization} Year ${classroom.year} Section ${classroom.section}\n`);

    // Create mock request and response objects
    const mockReq = {
      params: {
        id: classroom._id.toString(), // String ID like from HTTP params
      },
    };

    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.jsonData = data;
        return this;
      },
    };

    const mockNext = (error) => {
      if (error) {
        console.error('❌ Error in controller:', error);
      }
    };

    // Call the controller directly
    console.log('🚀 Calling getClassroomStudents controller...\n');
    console.log('═════════════════════════════════════════════════════════════');

    await getClassroomStudents(mockReq, mockRes, mockNext);

    console.log('═════════════════════════════════════════════════════════════\n');

    // Display results
    console.log('✅ Controller execution completed\n');
    
    if (mockRes.jsonData) {
      console.log('📊 RESPONSE DATA:\n');
      console.log('Status Code:', mockRes.statusCode);
      console.log('Success:', mockRes.jsonData.success);
      console.log('Student Count:', mockRes.jsonData.count);
      console.log('Students:', JSON.stringify(mockRes.jsonData.data, null, 2));
      
      if (mockRes.jsonData.debug) {
        console.log('\n🐛 DEBUG INFO FROM CONTROLLER:\n');
        console.log('classroomIdParam:', mockRes.jsonData.debug.classroomIdParam);
        console.log('classroomIdFromDb:', mockRes.jsonData.debug.classroomIdFromDb);
        console.log('Match?', mockRes.jsonData.debug.classroomIdMatch);
        console.log('Type Matches:', JSON.stringify(mockRes.jsonData.debug.typeMatches, null, 2));
      }
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testGetClassroomStudents();
